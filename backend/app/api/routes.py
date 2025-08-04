from fastapi import APIRouter
from app.services.websocket_service import websocket_service
from app.services.mqtt_service import mqtt_service

router = APIRouter(prefix="/api")

