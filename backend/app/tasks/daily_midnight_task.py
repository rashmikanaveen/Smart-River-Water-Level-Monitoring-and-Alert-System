import asyncio
import schedule
import time
from datetime import datetime
import logging
from threading import Thread

from app.startup.calculate_averages import calculate_end_of_day_averages

logger = logging.getLogger(__name__)

class DailyMidnightScheduler:
    def __init__(self):
        self.running = False
        self.thread = None
    
    def run_midnight_calculation(self):
        """Run the midnight calculation"""
        try:
            logger.info("🕛 Running midnight daily averages calculation...")
            # Run the async function in the event loop
            asyncio.run(calculate_end_of_day_averages())
            logger.info(" Midnight daily averages calculation completed")
        except Exception as e:
            logger.error(f"Error in midnight calculation: {e}")
    
    def schedule_daily_tasks(self):
        """Schedule the daily midnight task"""
        # Schedule for midnight (00:01 to ensure it's after midnight)
        schedule.every().day.at("00:01").do(self.run_midnight_calculation)
        logger.info(" Scheduled daily averages calculation for midnight (00:01)")
    
    def run_scheduler(self):
        """Run the scheduler in a separate thread"""
        self.schedule_daily_tasks()
        self.running = True
        logger.info(" Starting daily scheduler...")
        
        while self.running:
            schedule.run_pending()
            # Sleep in smaller intervals to allow faster shutdown
            for _ in range(60):  # 60 seconds = 60 * 1 second
                if not self.running:
                    break
                time.sleep(1)
    
    def start(self):
        """Start the scheduler in a background thread"""
        if not self.running:
            self.thread = Thread(target=self.run_scheduler, daemon=True)
            self.thread.start()
            logger.info("✅ Daily scheduler started")
    
    def stop(self):
        """Stop the scheduler"""
        self.running = False
        if self.thread and self.thread.is_alive():
            # Wait for thread to finish but with timeout
            self.thread.join(timeout=2.0)
            if self.thread.is_alive():
                logger.warning("! Daily scheduler thread did not stop cleanly")
            else:
                logger.info(" Daily scheduler stopped")
        else:
            logger.info(" Daily scheduler stopped")

# Global scheduler instance
daily_scheduler = DailyMidnightScheduler()