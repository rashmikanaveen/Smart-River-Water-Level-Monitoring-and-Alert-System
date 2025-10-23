from datetime import datetime, date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, and_, select
from typing import List, Optional
import logging

from app.models.database.sensor_measurements import SensorMeasurementDB
from app.models.database.daily_averages import DailyAverageDB
from app.models.database.unit import UnitDB

logger = logging.getLogger(__name__)

class DailyAveragesService:
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_active_units(self) -> List[UnitDB]:
        """Get all active UnitDB rows"""
        try:
            result = await self.db.execute(
                select(UnitDB).filter(UnitDB.is_active == True)
            )
            units = result.scalars().all()
            
            logger.info(f"Found {len(units)} active units: {[u.unit_id for u in units]}")
            return units
        except Exception as e:
            logger.error(f"Error getting active units: {e}")
            return []
    
    async def get_last_calculated_date(self, unit_id: str) -> Optional[date]:
        """Get the last date for which averages were calculated for a unit"""
        try:
            result = await self.db.execute(
                select(DailyAverageDB.date)
                .filter(DailyAverageDB.unit_id == unit_id)
                .order_by(DailyAverageDB.date.desc())
                .limit(1)
            )
            last_record = result.scalar_one_or_none()
            logger.info(f"Last calculated date for unit {unit_id}: {last_record}")
            return last_record if last_record else None
        except Exception as e:
            logger.error(f"Error getting last calculated date for unit {unit_id}: {e}")
            return None
    
    async def get_unit_created_date(self, unit_id: str) -> Optional[date]:
        """Get the created date of a unit"""
        try:
            result = await self.db.execute(
                select(UnitDB).filter(UnitDB.unit_id == unit_id)
            )
            unit = result.scalar_one_or_none()
            if unit and unit.created_at:
                created_date = unit.created_at.date()
                logger.info(f"Unit {unit_id} created on: {created_date}")
                return created_date
            else:
                logger.warning(f"Unit {unit_id} not found or has no created_at date")
                return None
        except Exception as e:
            logger.error(f"Error getting unit created date for {unit_id}: {e}")
            return None
    
    def is_unit_new(self, created_date: date) -> bool:
        """Check if unit is less than one day old"""
        today = date.today()
        return created_date == today
    
    async def calculate_daily_averages_for_date(self, unit_id: str, target_date: date, store_zero_if_missing: bool = True) -> Optional[DailyAverageDB]:
        """Calculate daily averages for a specific unit and date"""
        try:
            # Query measurements for the specific date
            start_datetime = datetime.combine(target_date, datetime.min.time())
            end_datetime = datetime.combine(target_date + timedelta(days=1), datetime.min.time())
            
            logger.info(f"Calculating averages for unit {unit_id} on {target_date} (from {start_datetime} to {end_datetime})")
            
            result = await self.db.execute(
                select(
                    func.avg(SensorMeasurementDB.height).label('avg_height'),
                    func.avg(SensorMeasurementDB.temperature).label('avg_temperature'),
                    func.avg(SensorMeasurementDB.battery).label('avg_battery'),
                    func.avg(SensorMeasurementDB.rssi).label('avg_rssi'),
                    func.avg(SensorMeasurementDB.snr).label('avg_snr'),
                    func.min(SensorMeasurementDB.height).label('min_height'),
                    func.max(SensorMeasurementDB.height).label('max_height'),
                    func.count(SensorMeasurementDB.id).label('measurement_count')
                )
                .filter(
                    and_(
                        SensorMeasurementDB.unit_id == unit_id,
                        SensorMeasurementDB.recorded_at >= start_datetime,
                        SensorMeasurementDB.recorded_at < end_datetime
                    )
                )
            )
            
            measurements = result.first()
            
            # Check if there are measurements for this date
            if not measurements or measurements.measurement_count == 0:
                if store_zero_if_missing:
                    logger.info(f"No measurements found for unit {unit_id} on {target_date}, storing zero averages")
                    # Store zero averages for missing data
                    measurements_data = {
                        'avg_height': 0.0,
                        'avg_temperature': 0.0,
                        'avg_battery': 0.0,
                        'avg_rssi': 0.0,
                        'avg_snr': 0.0,
                        'min_height': 0.0,
                        'max_height': 0.0,
                        'measurement_count': 0
                    }
                else:
                    logger.info(f"No measurements found for unit {unit_id} on {target_date}")
                    return None
            else:
                logger.info(f"Found {measurements.measurement_count} measurements for unit {unit_id} on {target_date}")
                measurements_data = {
                    'avg_height': float(measurements.avg_height) if measurements.avg_height else 0.0,
                    'avg_temperature': float(measurements.avg_temperature) if measurements.avg_temperature else 0.0,
                    'avg_battery': float(measurements.avg_battery) if measurements.avg_battery else 0.0,
                    'avg_rssi': float(measurements.avg_rssi) if measurements.avg_rssi else 0.0,
                    'avg_snr': float(measurements.avg_snr) if measurements.avg_snr else 0.0,
                    'min_height': float(measurements.min_height) if measurements.min_height else 0.0,
                    'max_height': float(measurements.max_height) if measurements.max_height else 0.0,
                    'measurement_count': int(measurements.measurement_count)
                }
            
            # Check if record already exists
            existing_result = await self.db.execute(
                select(DailyAverageDB)
                .filter(
                    and_(
                        DailyAverageDB.unit_id == unit_id,
                        DailyAverageDB.date == target_date
                    )
                )
            )
            existing_record = existing_result.scalar_one_or_none()
            
            if existing_record:
                # Update existing record
                existing_record.avg_height = measurements_data['avg_height']
                existing_record.avg_temperature = measurements_data['avg_temperature']
                existing_record.avg_battery = measurements_data['avg_battery']
                existing_record.avg_rssi = measurements_data['avg_rssi']
                existing_record.avg_snr = measurements_data['avg_snr']
                existing_record.min_height = measurements_data['min_height']
                existing_record.max_height = measurements_data['max_height']
                existing_record.measurement_count = measurements_data['measurement_count']
                
                # Make sure to flush and commit the transaction
                await self.db.flush()
                await self.db.commit()
                logger.info(f"Updated daily averages for unit {unit_id} on {target_date} - avg_height: {existing_record.avg_height}, count: {existing_record.measurement_count}")
                return existing_record
            else:
                # Create new record
                daily_average = DailyAverageDB(
                    unit_id=unit_id,
                    date=target_date,
                    avg_height=measurements_data['avg_height'],
                    avg_temperature=measurements_data['avg_temperature'],
                    avg_battery=measurements_data['avg_battery'],
                    avg_rssi=measurements_data['avg_rssi'],
                    avg_snr=measurements_data['avg_snr'],
                    min_height=measurements_data['min_height'],
                    max_height=measurements_data['max_height'],
                    measurement_count=measurements_data['measurement_count']
                )
                
                self.db.add(daily_average)
                
                # Flush to get the ID and then commit
                await self.db.flush()
                await self.db.commit()
                
                # Refresh to get the saved data
                await self.db.refresh(daily_average)
                
                logger.info(f" Created daily averages for unit {unit_id} on {target_date} - avg_height: {daily_average.avg_height}, count: {daily_average.measurement_count}, ID: {daily_average.id}")
                return daily_average
                
        except Exception as e:
            logger.error(f" Error calculating daily averages for unit {unit_id} on {target_date}: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            await self.db.rollback()
            return None
    
    async def calculate_current_day_averages_for_new_unit(self, unit_id: str) -> Optional[DailyAverageDB]:
        """Calculate current day averages for new units (less than 1 day old)"""
        try:
            today = date.today()
            start_datetime = datetime.combine(today, datetime.min.time())
            end_datetime = datetime.now()  # Up to current time
            
            logger.info(f"Calculating current day averages for new unit {unit_id} from {start_datetime} to {end_datetime}")
            
            result = await self.db.execute(
                select(
                    func.avg(SensorMeasurementDB.height).label('avg_height'),
                    func.avg(SensorMeasurementDB.temperature).label('avg_temperature'),
                    func.avg(SensorMeasurementDB.battery).label('avg_battery'),
                    func.avg(SensorMeasurementDB.rssi).label('avg_rssi'),
                    func.avg(SensorMeasurementDB.snr).label('avg_snr'),
                    func.min(SensorMeasurementDB.height).label('min_height'),
                    func.max(SensorMeasurementDB.height).label('max_height'),
                    func.count(SensorMeasurementDB.id).label('measurement_count')
                )
                .filter(
                    and_(
                        SensorMeasurementDB.unit_id == unit_id,
                        SensorMeasurementDB.recorded_at >= start_datetime,
                        SensorMeasurementDB.recorded_at <= end_datetime
                    )
                )
            )
            
            measurements = result.first()
            
            if not measurements or measurements.measurement_count == 0:
                logger.info(f"No current day measurements found for new unit {unit_id}")
                return None
            
            logger.info(f"Found {measurements.measurement_count} current day measurements for unit {unit_id}")
            
            # Store current day averages
            return await self.calculate_daily_averages_for_date(unit_id, today, store_zero_if_missing=False)
                
        except Exception as e:
            logger.error(f"Error calculating current day averages for unit {unit_id}: {str(e)}")
            return None
    
    async def calculate_missing_averages_for_unit(self, unit_id: str) -> int:
        """Calculate all missing daily averages for a unit from created_at to yesterday"""
        try:
            unit_created_date = await self.get_unit_created_date(unit_id)
            if not unit_created_date:
                logger.warning(f"Unit {unit_id} not found or has no created_at date")
                return 0
            
            # Check if unit is new (created today)
            if self.is_unit_new(unit_created_date):
                logger.info(f"Unit {unit_id} is new (created today), calculating current day averages")
                current_day_result = await self.calculate_current_day_averages_for_new_unit(unit_id)
                return 1 if current_day_result else 0
            
            last_calculated_date = await self.get_last_calculated_date(unit_id)
            
            # Determine start date
            if last_calculated_date:
                start_date = last_calculated_date + timedelta(days=1)
                logger.info(f"Unit {unit_id}: Resuming from {start_date} (last calculated: {last_calculated_date})")
            else:
                start_date = unit_created_date
                logger.info(f"Unit {unit_id}: Starting fresh from {start_date}")
            
            # End date is yesterday (don't calculate for today as it's incomplete for older units)
            end_date = date.today() - timedelta(days=1)
            
            if start_date > end_date:
                logger.info(f"No missing dates to calculate for unit {unit_id}")
                return 0
            
            logger.info(f"Calculating averages for unit {unit_id} from {start_date} to {end_date}")
            
            calculated_count = 0
            current_date = start_date
            
            while current_date <= end_date:
                result = await self.calculate_daily_averages_for_date(unit_id, current_date, store_zero_if_missing=True)
                if result:
                    calculated_count += 1
                current_date += timedelta(days=1)
            
            logger.info(f"Calculated {calculated_count} daily averages for unit {unit_id}")
            return calculated_count
            
        except Exception as e:
            logger.error(f" Error in calculate_missing_averages_for_unit for {unit_id}: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return 0
    
    async def calculate_all_missing_averages(self) -> dict:
        """Calculate missing averages for all active units"""
        try:
            active_units = await self.get_active_units()
            results = {}

            logger.info(f"Processing {len(active_units)} active units")

            for unit in active_units:
                unit_id = unit.unit_id
                try:
                    count = await self.calculate_missing_averages_for_unit(unit_id)
                    results[unit_id] = count
                except Exception as e:
                    logger.error(f"Error calculating averages for unit {unit_id}: {str(e)}")
                    results[unit_id] = 0

            return results
        except Exception as e:
            logger.error(f"Error in calculate_all_missing_averages: {e}")
            return {}
    
    async def calculate_end_of_day_averages(self) -> dict:
        """Calculate daily averages for all units at end of day (midnight)"""
        try:
            active_units = await self.get_active_units()
            results = {}
            yesterday = date.today() - timedelta(days=1)

            logger.info(f"Running end-of-day calculation for {len(active_units)} units for date: {yesterday}")

            for unit in active_units:
                unit_id = unit.unit_id
                try:
                    result = await self.calculate_daily_averages_for_date(unit_id, yesterday, store_zero_if_missing=True)
                    results[unit_id] = 1 if result else 0
                    logger.info(f"End-of-day calculation for unit {unit_id}: {'Success' if result else 'Failed'}")
                except Exception as e:
                    logger.error(f"Error in end-of-day calculation for unit {unit_id}: {str(e)}")
                    results[unit_id] = 0

            return results
        except Exception as e:
            logger.error(f"Error in calculate_end_of_day_averages: {e}")
            return {}