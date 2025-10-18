from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from datetime import date

from app.db.sessions import get_session
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.services.mqtt_service import mqtt_service
from app.services.websocket_service import websocket_service
from app.api.routes import router
from app.api.unit_routes import router as unit_router
from app.db.sessions import engine

from .models.user import User
from app.api.sensor_routes import router as sensor_router
from app.startup.calculate_averages import calculate_missing_averages_on_startup
from app.tasks.daily_midnight_task import daily_scheduler

# Add these imports for debug endpoint
from app.models.database.unit import UnitDB
from app.models.database.sensor_measurements import SensorMeasurementDB
from app.models.database.daily_averages import DailyAverageDB

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting Smart River Water Level Monitoring System...")

    # Test database connection at startup
    try:
        async with engine.begin() as conn:
            await conn.run_sync(lambda conn: None)
        logger.info("✓ Database connection successful")
    except Exception as e:
        logger.error(f"✗ Database connection failed: {e}")

    try:
        # Connect the services to avoid circular import
        mqtt_service.set_websocket_service(websocket_service)
        # Start MQTT service
        await mqtt_service.connect()
        logger.info("✓ MQTT service started")
    except Exception as e:
        logger.error(f"✗ Failed to start MQTT service: {e}")

    # Start daily scheduler
    try:
        daily_scheduler.start()
        logger.info("✓ Daily scheduler started")
    except Exception as e:
        logger.error(f"✗ Failed to start daily scheduler: {e}")

    # Calculate missing daily averages on startup
    try:
        logger.info("Calculating missing daily averages...")
        await calculate_missing_averages_on_startup()
        logger.info("✓ Daily averages calculation completed")
    except Exception as e:
        logger.error(f"✗ Error calculating daily averages: {e}")
        import traceback
        logger.error(traceback.format_exc())

    yield

    # Shutdown
    logger.info("🔄 Shutting down...")
    daily_scheduler.stop()
    await mqtt_service.disconnect()
    logger.info("✓ Shutdown completed")

# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Smart River Water Level Monitoring System",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router)

@app.get("/")
def read_root():
    return {
        "message": "Smart River Water Level Monitoring System",
        "version": settings.VERSION,
        "status": "running",
        "websocket_endpoint": "/ws",
        "api_docs": "/docs"
    }

# Add test endpoint for debugging
@app.get("/test/calculate-averages")
async def test_calculate_averages():
    """Test endpoint to manually trigger daily averages calculation"""
    try:
        logger.info("Manual test of daily averages calculation...")
        result = await calculate_missing_averages_on_startup()
        return {"status": "success", "results": result}
    except Exception as e:
        logger.error(f"Test calculation failed: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return {"status": "error", "message": str(e)}

@app.get("/test/debug-data")
async def debug_data(db: AsyncSession = Depends(get_session)):
    """Debug endpoint to check database data"""
    try:
        # Check units
        units_result = await db.execute(select(UnitDB))
        units = units_result.scalars().all()
        
        # Check measurements count by unit
        measurements_result = await db.execute(
            select(
                SensorMeasurementDB.unit_id,
                func.count(SensorMeasurementDB.id).label('count'),
                func.min(SensorMeasurementDB.recorded_at).label('earliest'),
                func.max(SensorMeasurementDB.recorded_at).label('latest')
            ).group_by(SensorMeasurementDB.unit_id)
        )
        measurements = measurements_result.all()
        
        # Check daily averages
        averages_result = await db.execute(
            select(DailyAverageDB).order_by(DailyAverageDB.unit_id, DailyAverageDB.date)
        )
        averages = averages_result.scalars().all()
        
        return {
            "units": [
                {
                    "unit_id": u.unit_id, 
                    "name": u.name,
                    "is_active": u.is_active, 
                    "created_at": str(u.created_at)
                } for u in units
            ],
            "measurements": [
                {
                    "unit_id": m.unit_id, 
                    "count": m.count, 
                    "earliest": str(m.earliest), 
                    "latest": str(m.latest)
                } for m in measurements
            ],
            "daily_averages": [
                {
                    "id": da.id,
                    "unit_id": da.unit_id, 
                    "date": str(da.date), 
                    "avg_height": da.avg_height,
                    "measurement_count": da.measurement_count
                } for da in averages
            ]
        }
    except Exception as e:
        import traceback
        logger.error(traceback.format_exc())
        return {"error": str(e)}

@app.get("/test/calculate-unit/{unit_id}")
async def test_calculate_unit(unit_id: str, db: AsyncSession = Depends(get_session)):
    """Test calculation for specific unit"""
    try:
        from app.services.daily_averages_service import DailyAveragesService
        
        service = DailyAveragesService(db)
        
        # Get unit info
        unit_created = await service.get_unit_created_date(unit_id)
        last_calculated = await service.get_last_calculated_date(unit_id)
        
        # Calculate missing averages
        count = await service.calculate_missing_averages_for_unit(unit_id)
        
        return {
            "unit_id": unit_id,
            "unit_created_date": str(unit_created) if unit_created else None,
            "last_calculated_date": str(last_calculated) if last_calculated else None,
            "calculated_records": count
        }
    except Exception as e:
        import traceback
        logger.error(traceback.format_exc())
        return {"error": str(e)}

@app.get("/test/force-calculate-today/{unit_id}")
async def force_calculate_today(unit_id: str, db: AsyncSession = Depends(get_session)):
    """Force calculate today's averages for testing"""
    try:
        from app.services.daily_averages_service import DailyAveragesService
        
        service = DailyAveragesService(db)
        today = date.today()
        
        logger.info(f"Force calculating averages for unit {unit_id} on {today}")
        
        # Force calculate for today
        result = await service.calculate_daily_averages_for_date(unit_id, today, store_zero_if_missing=True)
        
        if result:
            return {
                "success": True,
                "unit_id": unit_id,
                "date": str(today),
                "result": {
                    "id": result.id,
                    "avg_height": result.avg_height,
                    "avg_temperature": result.avg_temperature,
                    "measurement_count": result.measurement_count
                }
            }
        else:
            return {
                "success": False,
                "unit_id": unit_id,
                "date": str(today),
                "message": "Failed to calculate averages"
            }
    except Exception as e:
        import traceback
        logger.error(traceback.format_exc())
        return {"error": str(e)}

@app.get("/test/verify-averages")
async def verify_averages(db: AsyncSession = Depends(get_session)):
    """Verify what's actually in the daily_averages table"""
    try:
        # Get all records with details
        result = await db.execute(
            select(DailyAverageDB).order_by(DailyAverageDB.unit_id, DailyAverageDB.date)
        )
        averages = result.scalars().all()
        
        # Get count
        count_result = await db.execute(
            select(func.count(DailyAverageDB.id))
        )
        total_count = count_result.scalar()
        
        return {
            "total_records": total_count,
            "records": [
                {
                    "id": da.id,
                    "unit_id": da.unit_id,
                    "date": str(da.date),
                    "avg_height": da.avg_height,
                    "avg_temperature": da.avg_temperature,
                    "avg_battery": da.avg_battery,
                    "min_height": da.min_height,
                    "max_height": da.max_height,
                    "measurement_count": da.measurement_count
                } for da in averages
            ]
        }
    except Exception as e:
        import traceback
        logger.error(traceback.format_exc())
        return {"error": str(e)}

@app.post("/test/clear-averages")
async def clear_averages(db: AsyncSession = Depends(get_session)):
    """Clear all daily averages (for testing)"""
    try:
        from sqlalchemy import delete
        
        await db.execute(delete(DailyAverageDB))
        await db.commit()
        
        return {"message": "All daily averages cleared"}
    except Exception as e:
        await db.rollback()
        import traceback
        logger.error(traceback.format_exc())
        return {"error": str(e)}

@router.get("/users")
async def get_users(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(User))
    users = result.scalars().all()
    return users

app.include_router(router)
app.include_router(unit_router)
app.include_router(sensor_router)

@app.websocket("/ws/distance")
async def websocket_distance(websocket: WebSocket):
    logger.info("WebSocket connection for distance data")
    """WebSocket for distance data only"""
    await websocket_service.connect(websocket, "distance")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        websocket_service.disconnect(websocket)