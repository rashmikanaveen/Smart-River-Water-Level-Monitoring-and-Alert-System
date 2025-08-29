from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.sessions import get_session
from app.models.unit import Unit
from app.models.database.unit import UnitDB
from sqlalchemy.future import select

router = APIRouter()

@router.post("/addunit")
async def add_unit(unit: Unit, session: AsyncSession = Depends(get_session)):
    try:
        # Check if unit already exists
        result = await session.execute(select(UnitDB).where(UnitDB.unit_id == unit.unit_id))
        existing_unit = result.scalar_one_or_none()
        
        if existing_unit:
            raise HTTPException(status_code=400, detail="Unit already exists")
        
        # Create new unit
        new_unit = UnitDB(
            unit_id=unit.unit_id,
            name=unit.name,
            warning_level=unit.alertLevels.warning,
            high_level=unit.alertLevels.high,
            critical_level=unit.alertLevels.critical
        )
        
        session.add(new_unit)
        await session.commit()
        
        return {"message": "Unit added", "unit": {"unit_id": new_unit.unit_id, "name": new_unit.name}}
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Error adding unit: {str(e)}")

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