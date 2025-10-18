from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc
from datetime import datetime, timedelta
from typing import Optional, List
import logging

from app.db.sessions import get_session
from app.models.database.sensor_measurements import SensorMeasurementDB
from app.models.database.unit import UnitDB

router = APIRouter(prefix="/api/sensors", tags=["sensors"])
logger = logging.getLogger(__name__)

@router.get("/measurements/{unit_id}")
async def get_sensor_measurements(
    unit_id: str,  # Changed to str
    hours: Optional[int] = Query(24, description="Number of hours to fetch data for"),
    limit: Optional[int] = Query(100, description="Maximum number of records"),
    session: AsyncSession = Depends(get_session)
):
    """Get sensor measurements for a specific unit within time range"""
    try:
        # Check if unit exists
        unit_result = await session.execute(
            select(UnitDB).where(UnitDB.unit_id == unit_id)  # Assuming units table has unit_id
        )
        unit = unit_result.scalar_one_or_none()
        
        if not unit:
            raise HTTPException(status_code=404, detail="Unit not found")
        
        
        # Query measurements
        query = select(SensorMeasurementDB).where(
            SensorMeasurementDB.unit_id == unit_id,
        )
        
        result = await session.execute(query)
        measurements = result.scalars().all()
        
        # Format data for frontend
        data = []
        for measurement in reversed(measurements):  # Reverse to get chronological order
            data.append({
                "timestamp": measurement.recorded_at.isoformat(),
                "height": measurement.height,
            })
        
        return {
            "unit_id": unit_id,
            "unit_name": unit.name if hasattr(unit, 'name') else unit_id,
            "location": unit.location if hasattr(unit, 'location') else "Unknown",
            "data_points": len(data),
            "measurements": data
        }
        
    except Exception as e:
        logger.error(f"Error fetching measurements for unit {unit_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

