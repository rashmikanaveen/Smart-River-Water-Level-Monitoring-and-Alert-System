from gmqtt import Client as MQTTClient
import asyncio
import json
import logging
from datetime import datetime
from app.core.config import settings

logger = logging.getLogger(__name__)

class MQTTService:
    def __init__(self):
        self.client = MQTTClient(settings.MQTT_CLIENT_ID)
        self.is_connected = False
        self._websocket_service = None

    def set_websocket_service(self, ws_service):
        """Set websocket service to avoid circular import"""
        self._websocket_service = ws_service

    async def connect(self):
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message
        self.client.on_disconnect = self._on_disconnect
        
        try:
            await self.client.connect(settings.MQTT_BROKER_HOST, port=settings.MQTT_BROKER_PORT)
            logger.info(f" Connected to MQTT: {settings.MQTT_BROKER_HOST}")
        except Exception as e:
            logger.error(f" MQTT connection failed: {e}")
            raise

    async def disconnect(self):
        if self.is_connected:
            await self.client.disconnect()
            logger.info("🔌 MQTT disconnected")

    def _on_connect(self, client, flags, rc, properties):
        self.is_connected = True
        logger.info(" MQTT connected!")
        
        for topic in settings.MQTT_TOPICS:
            client.subscribe(topic)
            logger.info(f"📡 Subscribed to: {topic}")

    def _on_message(self, client, topic, payload, qos, properties):
        try:
            message = payload.decode('utf-8')
            logger.info(f"📡 [{topic}] {message}")
            
            if topic == "Distance":
                asyncio.create_task(self._handle_distance(message))
                
        except Exception as e:
            logger.error(f"Error processing message: {e}")

    async def _handle_distance(self, message: str):
        try:
            # Parse JSON message
            data = json.loads(message)
            
            
            #{"distance":100.12,"temp":25}
            unit_id = data.get("unit_id") 
            hight = float(data.get("hight", 0))
            temperature = float(data.get("temp", 0))
            battery = float(data.get("battery", 0))
            signal = float(data.get("signal", 0))
            sensor_status = data.get("sensor_status", 0)

            # Perform calculation
            calculated = hight * 2  # Example calculation
            
            result = {
                
                "unit_id": unit_id,
                "hight": calculated,
                "temperature": temperature,
                "battery": battery,
                "signal": signal,
                "trend":"up",
                "unit": "m",
                "sensor_status":sensor_status,
                "status":"normal",
                
            }
            
            # Broadcast via WebSocket if service is available
            if self._websocket_service:
                await self._websocket_service.broadcast_distance_data(result)
                logger.info(result)
                logger.info("\n")
            else:
                logger.warning("WebSocket service not available for broadcasting")
                
        except json.JSONDecodeError as e:
            logger.error(f" Invalid JSON format: {message} - {e}")
            
            # Fallback: try to handle as simple distance value
            try:
                distance = float(message.strip())
                calculated = distance * 2
                
                result = {
                    "topic": "Distance",
                    "unit_id": "unknown",
                    "original_distance": hight,
                    "calculated_reading": calculated,
                    "temperature": None,
                    "timestamp": datetime.now().isoformat(),
                    "unit": "cm",
                    "status": "success"
                }
                
                if self._websocket_service:
                    await self._websocket_service.broadcast_distance_data(calculated)
                    
                    
            except ValueError:
                logger.error(f" Could not parse as number either: {message}")
                
        except ValueError as e:
            logger.error(f" Invalid numeric values in JSON: {message} - {e}")
        except Exception as e:
            logger.error(f" Error handling distance message: {e}")

    def _on_disconnect(self, client, packet, exc=None):
        self.is_connected = False
        logger.warning(" MQTT disconnected!")

# Create singleton instance
mqtt_service = MQTTService()