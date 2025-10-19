from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.services.websocket_service import websocket_service
from app.services.mqtt_service import mqtt_service
from app.services.mqtt_cache_manager import mqtt_cache_manager
from app.db.sessions import get_session
from app.models.database.unit import UnitDB

router = APIRouter(prefix="/api")

@router.get("/cache/stats")
async def get_cache_statistics():
    """Get cache statistics"""
    try:
        stats = mqtt_service.get_cache_statistics()
        return {
            "cache_stats": stats,
            "message": "Cache statistics retrieved successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving cache stats: {str(e)}")

@router.delete("/cache/clear")
async def clear_all_cache():
    """Clear all cached normal values"""
    try:
        result = mqtt_service.clear_unit_cache()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing cache: {str(e)}")

@router.delete("/cache/clear/{unit_id}")
async def clear_unit_cache(unit_id: str):
    """Clear cache for specific unit"""
    try:
        result = mqtt_service.clear_unit_cache(unit_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing unit cache: {str(e)}")

@router.get("/mqtt/status")
async def get_mqtt_status():
    """Get MQTT connection status"""
    try:
        is_alive = await mqtt_service.is_connection_alive()
        return {
            "is_connected": mqtt_service.is_connected,
            "is_alive": is_alive,
            "websocket_connections": websocket_service.get_connection_stats(),
            "cache_stats": mqtt_service.get_cache_statistics()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting MQTT status: {str(e)}")

@router.get("/latest-data/{unit_id}")
async def get_latest_unit_data(unit_id: str, session: AsyncSession = Depends(get_session)):
    """
    Get the most recent sensor data for a specific unit from cache.
    Returns the latest MQTT data with the last update time.
    """
    try:
        # Get cached sensor data
        sensor_data = mqtt_cache_manager.get_latest_sensor_data(unit_id)
        
        if not sensor_data:
            raise HTTPException(
                status_code=404, 
                detail=f"No recent data available for unit {unit_id}. Unit may not have sent data yet."
            )
        
        # Get unit details from database
        result = await session.execute(
            select(UnitDB).where(UnitDB.unit_id == unit_id)
        )
        unit = result.scalars().first()
        
        if not unit:
            raise HTTPException(status_code=404, detail=f"Unit {unit_id} not found in database")
        
        # Get cached normal value
        normal_level = mqtt_cache_manager.get_cached_normal_value(unit_id)
        
        return {
            "unit_id": unit_id,
            "unit_name": unit.name,
            "location": unit.location,
            "sensor_data": {
                "distance": sensor_data["distance"],
                "temperature": sensor_data["temperature"],
                "battery": sensor_data["battery"],
                "rssi": sensor_data["rssi"],
                "snr": sensor_data["snr"],
                "last_updated": sensor_data["last_updated"].isoformat()
            },
            "alert_levels": {
                "normal": normal_level if normal_level else unit.normal_level,
                "warning": unit.warning_level,
                "high": unit.high_level,
                "critical": unit.critical_level
            },
            "is_active": unit.is_active
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving latest data: {str(e)}")

