import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.services.mqtt_service import mqtt_service
from app.services.websocket_service import websocket_service
from app.api.routes import router
from app.api.unit_routes import router as unit_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting Smart River Water Level Monitoring System...")
    
    try:
        # Connect the services to avoid circular import
        mqtt_service.set_websocket_service(websocket_service)
        
        # Start MQTT service
        await mqtt_service.connect()
        logger.info(" MQTT service started")
    except Exception as e:
        logger.error(f" Failed to start MQTT service: {e}")
    
    yield
    
    # Shutdown
    logger.info(" Shutting down...")
    await mqtt_service.disconnect()
    logger.info(" Shutdown completed")

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


app.include_router(unit_router)

@app.websocket("/ws/distance")
async def websocket_distance(websocket: WebSocket):
    logger.info( "WebSocket connection for distance data")
    """WebSocket for distance data only"""
    await websocket_service.connect(websocket, "distance")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        websocket_service.disconnect(websocket)