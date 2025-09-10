from fastapi import APIRouter, HTTPException
from app.services.websocket_service import websocket_service
from app.services.mqtt_service import mqtt_service

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

