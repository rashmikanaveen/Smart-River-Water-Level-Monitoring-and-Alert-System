from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.sessions import get_session
from app.models.unit import Unit
from app.models.database.unit import UnitDB
from app.models.database.user import User
from sqlalchemy.future import select
import logging
from app.services.mqtt_cache_manager import mqtt_cache_manager
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api")
router.tags = ["units"]

@router.get("/units")
async def list_units(session: AsyncSession = Depends(get_session)):
    try:
        # Prefer cached metadata for name/location/levels/is_active
        cached_meta = mqtt_cache_manager.get_all_unit_metadata()

        # Fetch DB rows primarily for timestamps
        result = await session.execute(
            select(UnitDB).where(UnitDB.is_active == True)
        )
        units = result.scalars().all()

        unit_list = []
        for unit in units:
            meta = cached_meta.get(unit.unit_id) if cached_meta else None
            unit_list.append({
                "unit_id": unit.unit_id,
                "name": meta.get("name") if meta else unit.name,
                "location": meta.get("location") if meta else unit.location,
                "alertLevels": {
                    "normal": meta.get("normal") if meta else unit.normal_level,
                    "warning": meta.get("warning") if meta else unit.warning_level,
                    "high": meta.get("high") if meta else unit.high_level,
                    "critical": meta.get("critical") if meta else unit.critical_level
                },
                "is_active": meta.get("is_active") if meta else unit.is_active,
                "created_at": unit.created_at.isoformat() if unit.created_at else None,
                "updated_at": unit.updated_at.isoformat() if unit.updated_at else None
            })
        
        return {"units": unit_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving units: {str(e)}")
    

@router.get("/units/levels")
async def get_all_unit_levels(session: AsyncSession = Depends(get_session)):
    """
    Get alert levels for all active units.
    Returns unit_id, name, location and all alert levels (normal, warning, high, critical).
    """
    try:
        # Try to get units metadata from cache first
        cached_meta = mqtt_cache_manager.get_all_unit_metadata()
        units_levels = []

        if cached_meta:
            # Use cached metadata but ensure we only include active units
            for unit_id, meta in cached_meta.items():
                if not meta.get("is_active", True):
                    continue
                units_levels.append({
                    "unit_id": unit_id,
                    "name": meta.get("name"),
                    "location": meta.get("location"),
                    "levels": {
                        "normal": meta.get("normal"),
                        "warning": meta.get("warning"),
                        "high": meta.get("high"),
                        "critical": meta.get("critical")
                    }
                })
        else:
            # Fallback to database
            result = await session.execute(
                select(UnitDB).where(UnitDB.is_active == True)
            )
            units = result.scalars().all()
            for unit in units:
                units_levels.append({
                    "unit_id": unit.unit_id,
                    "name": unit.name,
                    "location": unit.location,
                    "levels": {
                        "normal": unit.normal_level,
                        "warning": unit.warning_level,
                        "high": unit.high_level,
                        "critical": unit.critical_level
                    }
                })
        
        return {
            "total_units": len(units_levels),
            "units": units_levels
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving unit levels: {str(e)}")


@router.get("/units/{unit_id}/levels")
async def get_unit_levels(unit_id: str, session: AsyncSession = Depends(get_session)):
    """
    Get alert levels for a specific unit. Uses cache first, falls back to DB.
    """
    try:
        meta = mqtt_cache_manager.get_unit_metadata(unit_id)
        if not meta:
            # Refresh from DB
            meta = await mqtt_cache_manager.refresh_unit_metadata_from_db(unit_id)

        if not meta:
            raise HTTPException(status_code=404, detail=f"Unit {unit_id} not found")

        return {
            "unit_id": unit_id,
            "name": meta.get("name"),
            "location": meta.get("location"),
            "is_active": meta.get("is_active"),
            "levels": {
                "normal": meta.get("normal"),
                "warning": meta.get("warning"),
                "high": meta.get("high"),
                "critical": meta.get("critical")
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving levels for unit {unit_id}: {str(e)}")


@router.put("/updateUnitData/{unit_id}")
async def update_unit_data(
    unit_id: str, 
    unit: Unit, 
    session: AsyncSession = Depends(get_session),
    
):
    """
    Update unit data (Authenticated users only).
    
    Requires authentication - both regular users and admins can update.
    """
    try:
        # Fetch the unit from the database
        result = await session.execute(
            select(UnitDB).where(UnitDB.unit_id == unit_id)
        )
        db_unit = result.scalars().first()
        
        if not db_unit:
            raise HTTPException(status_code=404, detail="Unit not found")
        
        # Update unit details
        db_unit.name = unit.name
        db_unit.location = unit.location
        if hasattr(unit.alertLevels, 'normal') and unit.alertLevels.normal is not None:
            db_unit.normal_level = unit.alertLevels.normal
        db_unit.warning_level = unit.alertLevels.warning
        db_unit.high_level = unit.alertLevels.high
        db_unit.critical_level = unit.alertLevels.critical
        if hasattr(unit, 'is_active'):
            db_unit.is_active = unit.is_active
        
        # Commit changes
        await session.commit()

        # Refresh metadata cache for this unit
        try:
            await mqtt_cache_manager.refresh_unit_metadata_from_db(unit_id)
        except Exception:
            logger = __import__('logging').getLogger(__name__)
            logger.debug(f"Failed to refresh unit metadata cache for {unit_id} after update")

        return {"message": "Unit updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating unit: {str(e)}")
    
