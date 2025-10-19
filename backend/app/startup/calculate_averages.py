from app.services.daily_averages_service import DailyAveragesService
from app.db.sessions import AsyncSessionLocal
import logging

logger = logging.getLogger(__name__)

async def calculate_missing_averages_on_startup():
    """
    Async function to run on system startup to calculate any missing daily averages
    """
    async with AsyncSessionLocal() as db:
        try:
            service = DailyAveragesService(db)
            
            logger.info("Starting calculation of missing daily averages...")
            results = await service.calculate_all_missing_averages()
            
            total_calculated = sum(results.values())
            logger.info(f"Startup calculation complete. Total records calculated: {total_calculated}")
            
            for unit_id, count in results.items():
                if count > 0:
                    logger.info(f"Unit {unit_id}: {count} daily averages calculated")
            
            return results
            
        except Exception as e:
            logger.error(f"Error during startup average calculation: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return {}

async def calculate_end_of_day_averages():
    """
    Calculate end-of-day averages for all units (called at midnight)
    """
    async with AsyncSessionLocal() as db:
        try:
            service = DailyAveragesService(db)
            
            logger.info("Starting end-of-day daily averages calculation...")
            results = await service.calculate_end_of_day_averages()
            
            total_calculated = sum(results.values())
            logger.info(f"End-of-day calculation complete. Total records calculated: {total_calculated}")
            
            return results
            
        except Exception as e:
            logger.error(f"Error during end-of-day average calculation: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return {}

async def calculate_averages_for_specific_unit(unit_id: str):
    """Calculate missing averages for a specific unit"""
    async with AsyncSessionLocal() as db:
        try:
            service = DailyAveragesService(db)
            
            logger.info(f"Calculating missing daily averages for unit {unit_id}...")
            count = await service.calculate_missing_averages_for_unit(unit_id)
            
            logger.info(f"Calculation complete for unit {unit_id}. Records calculated: {count}")
            return count
            
        except Exception as e:
            logger.error(f"Error calculating averages for unit {unit_id}: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return 0