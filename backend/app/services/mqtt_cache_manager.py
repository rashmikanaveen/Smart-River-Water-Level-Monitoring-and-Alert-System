import logging
from typing import Dict, Optional
from datetime import datetime
from sqlalchemy.future import select
from app.db.sessions import get_session
from app.models.database.unit import UnitDB

logger = logging.getLogger(__name__)

class MQTTCacheManager:
    """
    Cache manager to optimize database calls for normal values
    Logic:
    1. Check server-side cache first
    2. If not found, check database
    3. Only calculate and save if both cache and database don't have normal value
    4. Calculate normal value from first 12 MQTT readings average
    """
    
    def __init__(self):
        # Server-side cache for normal values
        # Structure: {unit_id: {"normal_level": float, "has_normal": bool, "last_updated": datetime}}
        self._normal_values_cache: Dict[str, Dict] = {}
        
        # Cache for collecting first readings to calculate normal value
        # Structure: {unit_id: {"readings": [float], "count": int}}
        self._first_readings_cache: Dict[str, Dict] = {}
        
        # Cache for latest sensor data from MQTT
        # Structure: {unit_id: {"distance": float, "temperature": float, "battery": float, 
        #                       "rssi": int, "snr": float, "last_updated": datetime}}
        self._latest_sensor_data_cache: Dict[str, Dict] = {}
        
        # Number of readings to collect for normal value calculation
        self.NORMAL_CALCULATION_READINGS = 12
        
    def has_normal_value_cached(self, unit_id: str) -> bool:
        """Check if unit has normal value in server-side cache"""
        if unit_id not in self._normal_values_cache:
            return False
        return self._normal_values_cache[unit_id].get("has_normal", False)
    
    def get_cached_normal_value(self, unit_id: str) -> Optional[float]:
        """Get cached normal value if available"""
        if self.has_normal_value_cached(unit_id):
            return self._normal_values_cache[unit_id].get("normal_level")
        return None
    
    def set_cached_normal_value(self, unit_id: str, normal_level: float):
        """Cache normal value for unit"""
        self._normal_values_cache[unit_id] = {
            "normal_level": normal_level,
            "has_normal": True,
            "last_updated": datetime.now()
        }
        logger.info(f"Cached normal value for unit {unit_id}: {normal_level}")
    
    def mark_unit_no_normal(self, unit_id: str):
        """Mark unit as having no normal value to avoid repeated DB checks"""
        self._normal_values_cache[unit_id] = {
            "normal_level": None,
            "has_normal": False,
            "last_updated": datetime.now()
        }
    
    async def check_database_for_normal_value(self, unit_id: str) -> Optional[float]:
        """Check database for existing normal value"""
        try:
            async for session in get_session():
                result = await session.execute(
                    select(UnitDB.normal_level).where(UnitDB.unit_id == unit_id)
                )
                normal_level = result.scalar_one_or_none()
                
                if normal_level is not None:
                    # Cache the found value
                    self.set_cached_normal_value(unit_id, normal_level)
                    logger.info(f"Found normal value in database for unit {unit_id}: {normal_level}")
                else:
                    # Mark as not having normal value
                    self.mark_unit_no_normal(unit_id)
                    logger.info(f"No normal value found in database for unit {unit_id}")
                
                return normal_level
                
        except Exception as e:
            logger.error(f"Error checking database for normal value of unit {unit_id}: {e}")
            return None
    
    async def save_normal_value_to_database(self, unit_id: str, normal_level: float) -> bool:
        """Save calculated normal value to database"""
        try:
            async for session in get_session():
                # Check if unit exists, if not create it
                result = await session.execute(
                    select(UnitDB).where(UnitDB.unit_id == unit_id)
                )
                unit = result.scalar_one_or_none()
                
                if unit:
                    # Update existing unit
                    unit.normal_level = normal_level
                    logger.info(f"Updated normal value for existing unit {unit_id}: {normal_level}")
                else:
                    # Create new unit with normal value
                    new_unit = UnitDB(
                        unit_id=unit_id,
                        name=f"Unit {unit_id}",  # Default name
                        normal_level=normal_level
                    )
                    session.add(new_unit)
                    logger.info(f"Created new unit {unit_id} with normal value: {normal_level}")
                
                await session.commit()
                
                # Cache the saved value
                self.set_cached_normal_value(unit_id, normal_level)
                return True
                
        except Exception as e:
            logger.error(f"Error saving normal value to database for unit {unit_id}: {e}")
            return False
    
    async def get_or_calculate_normal_value(self, unit_id: str, current_height: float) -> float:
        """
        Get normal value with optimized logic:
        1. Check server-side cache first
        2. If cache says false, check database
        3. Only calculate if both cache and database don't have normal value
        """
        
        # Step 1: Check server-side cache
        if self.has_normal_value_cached(unit_id):
            cached_value = self.get_cached_normal_value(unit_id)
            logger.debug(f"Using cached normal value for unit {unit_id}: {cached_value}")
            return cached_value
        
        # Step 2: Cache says false or doesn't exist, check database
        logger.info(f"No cached normal value for unit {unit_id}, checking database...")
        db_normal_value = await self.check_database_for_normal_value(unit_id)
        
        if db_normal_value is not None:
            logger.debug(f"Using database normal value for unit {unit_id}: {db_normal_value}")
            return db_normal_value
        
        # Step 3: Both cache and database don't have normal value, calculate new one
        logger.info(f"No normal value found for unit {unit_id}, calculating new normal value...")
        calculated_normal = await self._calculate_normal_value(unit_id, current_height)
        
        # Save to database and cache
        save_success = await self.save_normal_value_to_database(unit_id, calculated_normal)
        if save_success:
            logger.info(f"Successfully calculated and saved normal value for unit {unit_id}: {calculated_normal}")
        else:
            logger.warning(f"Failed to save calculated normal value for unit {unit_id}")
            # Still cache it for this session
            self.set_cached_normal_value(unit_id, calculated_normal)
        
        return calculated_normal
    
    async def _calculate_normal_value(self, unit_id: str, current_height: float) -> float:
        """
        Calculate normal value from first 12 MQTT readings average
        Collects readings until we have 12, then calculates average
        """
        try:
            # Initialize readings cache for this unit if not exists
            if unit_id not in self._first_readings_cache:
                self._first_readings_cache[unit_id] = {
                    "readings": [],
                    "count": 0
                }
            
            readings_data = self._first_readings_cache[unit_id]
            
            # Add current reading to collection
            if readings_data["count"] < self.NORMAL_CALCULATION_READINGS:
                readings_data["readings"].append(current_height)
                readings_data["count"] += 1
                
                logger.info(f"Collected reading {readings_data['count']}/{self.NORMAL_CALCULATION_READINGS} for unit {unit_id}: {current_height}")
                
                # If we haven't collected enough readings yet, return current height as temporary normal
                if readings_data["count"] < self.NORMAL_CALCULATION_READINGS:
                    logger.info(f"Not enough readings yet for unit {unit_id}. Using current height as temporary normal: {current_height}")
                    return current_height
                
                # We have collected enough readings, calculate average
                total_readings = sum(readings_data["readings"])
                calculated_normal = total_readings / self.NORMAL_CALCULATION_READINGS
                
                logger.info(f"Calculated normal value for unit {unit_id} from {self.NORMAL_CALCULATION_READINGS} readings: {calculated_normal}")
                logger.debug(f"Readings used: {readings_data['readings']}")
                
                # Clear the readings cache as we no longer need it
                del self._first_readings_cache[unit_id]
                
                return calculated_normal
            else:
                # This shouldn't happen as we should have calculated normal already
                # But as fallback, use current height
                logger.warning(f"Unexpected state: unit {unit_id} has more than {self.NORMAL_CALCULATION_READINGS} readings in cache")
                return current_height
            
        except Exception as e:
            logger.error(f"Error calculating normal value for unit {unit_id}: {e}")
            # Fallback to current height
            return current_height
    
    def update_latest_sensor_data(self, unit_id: str, distance: float, temperature: float, 
                                   battery: float, rssi: int, snr: float):
        """Update the latest sensor data cache when MQTT data arrives"""
        self._latest_sensor_data_cache[unit_id] = {
            "distance": distance,
            "temperature": temperature,
            "battery": battery,
            "rssi": rssi,
            "snr": snr,
            "last_updated": datetime.now()
        }
        logger.debug(f"Updated latest sensor data cache for unit {unit_id}")
    
    def get_latest_sensor_data(self, unit_id: str) -> Optional[Dict]:
        """Get the latest cached sensor data for a unit"""
        return self._latest_sensor_data_cache.get(unit_id)
    
    def get_all_latest_sensor_data(self) -> Dict[str, Dict]:
        """Get all cached latest sensor data for all units"""
        return self._latest_sensor_data_cache.copy()
    
    def clear_cache(self, unit_id: Optional[str] = None):
        """Clear cache for specific unit or all units"""
        if unit_id:
            if unit_id in self._normal_values_cache:
                del self._normal_values_cache[unit_id]
                logger.info(f"Cleared normal values cache for unit {unit_id}")
            if unit_id in self._first_readings_cache:
                del self._first_readings_cache[unit_id]
                logger.info(f"Cleared first readings cache for unit {unit_id}")
            if unit_id in self._latest_sensor_data_cache:
                del self._latest_sensor_data_cache[unit_id]
                logger.info(f"Cleared latest sensor data cache for unit {unit_id}")
        else:
            self._normal_values_cache.clear()
            self._first_readings_cache.clear()
            self._latest_sensor_data_cache.clear()
            logger.info("Cleared all cache")
    
    def get_cache_stats(self) -> Dict:
        """Get cache statistics"""
        total_units = len(self._normal_values_cache)
        units_with_normal = len([u for u in self._normal_values_cache.values() if u.get("has_normal", False)])
        units_collecting_readings = len(self._first_readings_cache)
        units_with_sensor_data = len(self._latest_sensor_data_cache)
        
        return {
            "total_cached_units": total_units,
            "units_with_normal_values": units_with_normal,
            "units_without_normal_values": total_units - units_with_normal,
            "units_collecting_first_readings": units_collecting_readings,
            "units_with_latest_sensor_data": units_with_sensor_data,
            "normal_calculation_readings_required": self.NORMAL_CALCULATION_READINGS,
            "cache_hit_ratio": units_with_normal / total_units if total_units > 0 else 0,
            "first_readings_details": {
                unit_id: {
                    "collected_readings": data["count"],
                    "remaining_readings": self.NORMAL_CALCULATION_READINGS - data["count"]
                }
                for unit_id, data in self._first_readings_cache.items()
            }
        }

# Create singleton instance
mqtt_cache_manager = MQTTCacheManager()
