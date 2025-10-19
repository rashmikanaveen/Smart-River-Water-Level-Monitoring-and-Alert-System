from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, desc
from app.db.sessions import get_session
from app.models.database.daily_averages import DailyAverageDB
from app.models.database.unit import UnitDB
from datetime import date, datetime, timedelta
from typing import Optional

router = router = APIRouter(prefix="/api")
router.tags = ["averages"]

@router.get("/averages/{unit_id}")
async def get_unit_averages(
    unit_id: str,
    start_date: Optional[str] = Query(None, description="Start date in YYYY-MM-DD format"),
    end_date: Optional[str] = Query(None, description="End date in YYYY-MM-DD format"),
    days: Optional[int] = Query(30, description="Number of days to fetch (default 30, used if dates not provided)"),
    session: AsyncSession = Depends(get_session)
):
    """
    Get daily average values for a specific unit to plot graphs.
    
    Parameters:
    - unit_id: The unit ID to fetch data for
    - start_date: Optional start date (YYYY-MM-DD)
    - end_date: Optional end date (YYYY-MM-DD)
    - days: Number of days to fetch if dates not provided (default 30)
    
    Returns:
    - Daily average data including height, temperature, battery, rssi, snr
    """
    try:
        # Verify unit exists
        unit_result = await session.execute(
            select(UnitDB).where(UnitDB.unit_id == unit_id)
        )
        unit = unit_result.scalars().first()
        
        if not unit:
            raise HTTPException(status_code=404, detail=f"Unit {unit_id} not found")
        
        # Determine date range
        if start_date and end_date:
            try:
                start = datetime.strptime(start_date, "%Y-%m-%d").date()
                end = datetime.strptime(end_date, "%Y-%m-%d").date()
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        else:
            end = date.today()
            start = end - timedelta(days=days)
        
        # Query daily averages
        query = select(DailyAverageDB).where(
            and_(
                DailyAverageDB.unit_id == unit_id,
                DailyAverageDB.date >= start,
                DailyAverageDB.date <= end
            )
        ).order_by(DailyAverageDB.date)
        
        result = await session.execute(query)
        averages = result.scalars().all()
        
        # Format response for graphing
        graph_data = {
            "unit_id": unit_id,
            "unit_name": unit.name,
            "location": unit.location,
            "date_range": {
                "start": start.isoformat(),
                "end": end.isoformat()
            },
            "alert_levels": {
                "normal": unit.normal_level,
                "warning": unit.warning_level,
                "high": unit.high_level,
                "critical": unit.critical_level
            },
            "data_points": len(averages),
            "data": []
        }
        
        for avg in averages:
            graph_data["data"].append({
                "date": avg.date.isoformat(),
                "avg_height": avg.avg_height,
                "min_height": avg.min_height,
                "max_height": avg.max_height,
                "avg_temperature": avg.avg_temperature,
                "avg_battery": avg.avg_battery,
                "avg_rssi": avg.avg_rssi,
                "avg_snr": avg.avg_snr,
                "measurement_count": avg.measurement_count
            })
        
        return graph_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving averages: {str(e)}")


@router.get("/averages/{unit_id}/latest")
async def get_latest_averages(
    unit_id: str,
    limit: int = Query(7, description="Number of latest records to fetch (default 7)"),
    session: AsyncSession = Depends(get_session)
):
    """
    Get the latest N daily average records for a unit.
    Useful for quick overview charts.
    """
    try:
        # Verify unit exists
        unit_result = await session.execute(
            select(UnitDB).where(UnitDB.unit_id == unit_id)
        )
        unit = unit_result.scalars().first()
        
        if not unit:
            raise HTTPException(status_code=404, detail=f"Unit {unit_id} not found")
        
        # Query latest averages
        query = select(DailyAverageDB).where(
            DailyAverageDB.unit_id == unit_id
        ).order_by(desc(DailyAverageDB.date)).limit(limit)
        
        result = await session.execute(query)
        averages = result.scalars().all()
        
        # Reverse to get chronological order
        averages = list(reversed(averages))
        
        # Format response
        response_data = {
            "unit_id": unit_id,
            "unit_name": unit.name,
            "location": unit.location,
            "alert_levels": {
                "normal": unit.normal_level,
                "warning": unit.warning_level,
                "high": unit.high_level,
                "critical": unit.critical_level
            },
            "records_count": len(averages),
            "data": []
        }
        
        for avg in averages:
            response_data["data"].append({
                "date": avg.date.isoformat(),
                "avg_height": avg.avg_height,
                "min_height": avg.min_height,
                "max_height": avg.max_height,
                "avg_temperature": avg.avg_temperature,
                "avg_battery": avg.avg_battery,
                "avg_rssi": avg.avg_rssi,
                "avg_snr": avg.avg_snr,
                "measurement_count": avg.measurement_count
            })
        
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving latest averages: {str(e)}")

