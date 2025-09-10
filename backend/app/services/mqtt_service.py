from gmqtt import Client as MQTTClient
import asyncio
import json
import logging
from datetime import datetime, timedelta
from app.core.config import settings
from app.db.sessions import get_session
from app.models.database.sensor_measurements import SensorMeasurementDB
from app.services.mqtt_cache_manager import mqtt_cache_manager

logger = logging.getLogger(__name__)

class MQTTService:
    def __init__(self):
        self.client = MQTTClient(settings.MQTT_CLIENT_ID)
        self.is_connected = False
        self._websocket_service = None
        self._reconnect_attempts = 0
        self._max_reconnect_attempts = 5
        self._reconnect_delay = 5  # seconds
        self._last_save_times = {}  # Track last save time per unit
        self._save_interval = 30  # Save interval in seconds (2 minutes)

    def set_websocket_service(self, ws_service):
        """Set websocket service to avoid circular import"""
        self._websocket_service = ws_service

    async def connect(self):
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message
        self.client.on_disconnect = self._on_disconnect
        
        try:
            await self.client.connect(
                settings.MQTT_BROKER_HOST, 
                port=settings.MQTT_BROKER_PORT,
                keepalive=60  # Keep connection alive for 60 seconds
            )
            logger.info(f"Connected to MQTT: {settings.MQTT_BROKER_HOST}")
            self._reconnect_attempts = 0
        except Exception as e:
            logger.error(f"MQTT connection failed: {e}")
            await self._handle_reconnection()

    async def disconnect(self):
        if self.is_connected:
            await self.client.disconnect()
            logger.info("MQTT disconnected")

    def _on_connect(self, client, flags, rc, properties):
        self.is_connected = True
        self._reconnect_attempts = 0
        logger.info("MQTT connected successfully")
        
        for topic in settings.MQTT_TOPICS:
            client.subscribe(topic)
            logger.info(f"Subscribed to: {topic}")

    def _on_message(self, client, topic, payload, qos, properties):
        try:
            message = payload.decode('utf-8')
            
            if topic == "lora/water_lavel":
                # Create task without waiting to avoid blocking
                asyncio.create_task(self._handle_distance(message))
                
        except Exception as e:
            logger.error(f"Error processing message: {e}")

    async def _handle_distance(self, message: str):
        try:
            # Parse JSON message
            data = json.loads(message)
            
            unit_id = data.get("i") 
            height = float(data.get("d", 0))
            temperature = float(data.get("t", 0))
            battery = float(data.get("b", 0))
            rssi = float(data.get("rssi", 0))
            snr = float(data.get("snr", 0))
            time = datetime.now().isoformat()

            # Get normal value using optimized cache logic
            normal_value = await mqtt_cache_manager.get_or_calculate_normal_value(unit_id, height)

            # Calculate water level relative to normal
            # You can modify this calculation based on your requirements
            result = {
                "unit_id": unit_id,
                "hight": height,  # Keep for WebSocket compatibility
                "normal_level": normal_value,  # Include normal level in response
                "raw_height": height,  # Include raw sensor reading
                "temperature": temperature,
                "battery": battery,
                "signal": 35,
                "trend": "up",
                "sensor_status": "normal",
                "status": "normal",
                "time": time
            }

            # Save to database only if enough time has passed (non-blocking)
            if self._should_save_measurement(unit_id):
                asyncio.create_task(self._save_measurement(unit_id, height, temperature, battery, rssi, snr))
                self._last_save_times[unit_id] = datetime.now()
            
            # Broadcast via WebSocket if service is available (always broadcast for real-time updates)
            if self._websocket_service:
                await self._websocket_service.broadcast_distance_data(result)
            else:
                logger.warning("WebSocket service not available for broadcasting")
                
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON format: {message} - {e}")
                
        except ValueError as e:
            logger.error(f"Invalid numeric values in JSON: {message} - {e}")
        except Exception as e:
            logger.error(f"Error handling distance message: {e}")

    def _should_save_measurement(self, unit_id: str) -> bool:
        """Check if enough time has passed since last save for this unit"""
        last_save = self._last_save_times.get(unit_id)
        if last_save is None:
            # First time saving for this unit
            return True
        
        time_since_last_save = (datetime.now() - last_save).total_seconds()
        return time_since_last_save >= self._save_interval

    async def _save_measurement(self, unit_id: str, height: float, temperature: float, 
                              battery: float, rssi: float, snr: float):
        """Save sensor measurement to database"""
        try:
            async for session in get_session():
                measurement = SensorMeasurementDB(
                    unit_id=unit_id,
                    height=height,
                    temperature=temperature,
                    battery=battery,
                    rssi=rssi,
                    snr=snr
                )
                session.add(measurement)
                await session.commit()
                break  # Exit the async generator after successful commit
        except Exception as e:
            logger.error(f"Failed to save measurement: {e}")

    def _on_disconnect(self, client, packet, exc=None):
        self.is_connected = False
        if exc:
            logger.error(f"MQTT disconnected unexpectedly: {exc}")
            # Only reconnect if disconnection was unexpected
            asyncio.create_task(self._handle_reconnection())
        else:
            logger.info("MQTT disconnected gracefully")

    async def _handle_reconnection(self):
        """Handle automatic reconnection with exponential backoff"""
        if self._reconnect_attempts >= self._max_reconnect_attempts:
            logger.error(f"Max reconnection attempts ({self._max_reconnect_attempts}) reached")
            return

        self._reconnect_attempts += 1
        delay = min(self._reconnect_delay * (2 ** (self._reconnect_attempts - 1)), 60)
        
        logger.info(f"Attempting to reconnect in {delay} seconds (attempt {self._reconnect_attempts})")
        await asyncio.sleep(delay)
        
        try:
            await self.connect()
        except Exception as e:
            logger.error(f"Reconnection attempt {self._reconnect_attempts} failed: {e}")
            await self._handle_reconnection()

    async def is_connection_alive(self):
        """Check if MQTT connection is alive"""
        return self.is_connected and self.client.is_connected

    async def ensure_connection(self):
        """Ensure MQTT connection is active"""
        if not await self.is_connection_alive():
            logger.warning("MQTT connection lost, attempting to reconnect")
            await self._handle_reconnection()

    def get_cache_statistics(self):
        """Get cache statistics from cache manager"""
        return mqtt_cache_manager.get_cache_stats()

    def clear_unit_cache(self, unit_id: str = None):
        """Clear cache for specific unit or all units"""
        mqtt_cache_manager.clear_cache(unit_id)
        return {"message": f"Cache cleared for {'all units' if not unit_id else f'unit {unit_id}'}"}

    def set_save_interval(self, interval_seconds: int):
        """Set the save interval in seconds (default is 120 seconds / 2 minutes)"""
        self._save_interval = interval_seconds
        logger.info(f"Save interval set to {interval_seconds} seconds")

    def get_save_interval(self) -> int:
        """Get current save interval in seconds"""
        return self._save_interval

# Create singleton instance
mqtt_service = MQTTService()