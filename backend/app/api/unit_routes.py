from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.sessions import get_session
from app.models.unit import Unit
from app.models.database.unit import UnitDB
from sqlalchemy.future import select

router = APIRouter(prefix="/api")

@router.get("/units")
async def list_units(session: AsyncSession = Depends(get_session)):
    try:
        # Get all active units with full details
        result = await session.execute(
            select(UnitDB).where(UnitDB.is_active == True)
        )
        units = result.scalars().all()
        
        # Convert to response format
        unit_list = []
        for unit in units:
            unit_list.append({
                "unit_id": unit.unit_id,
                "name": unit.name,
                "location": unit.location,
                "alertLevels": {
                    "normal": unit.normal_level,
                    "warning": unit.warning_level,
                    "high": unit.high_level,
                    "critical": unit.critical_level
                },
                "is_active": unit.is_active,
                "created_at": unit.created_at.isoformat() if unit.created_at else None,
                "updated_at": unit.updated_at.isoformat() if unit.updated_at else None
            })
        
        return {"units": unit_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving units: {str(e)}")
    

@router.put("/updateUnitData/{unit_id}")
async def update_unit_data(unit_id: str, unit: Unit, session: AsyncSession = Depends(get_session)):
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
        
        return {"message": "Unit updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating unit: {str(e)}")