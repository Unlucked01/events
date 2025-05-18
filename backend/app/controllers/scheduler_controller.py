import os
import logging
import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from dotenv import load_dotenv

from .telegram_controller import TelegramController

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get base URL from environment variables or use default
BASE_URL = os.getenv("BASE_URL", "http://localhost:3000")

class SchedulerController:
    def __init__(self):
        """Initialize scheduler."""
        self.scheduler = AsyncIOScheduler()
        self._configure_jobs()
    
    def _configure_jobs(self):
        """Configure scheduled jobs."""
        # Daily job at 10:00 AM to send reminders for events happening in the next 24 hours
        self.scheduler.add_job(
            self._send_daily_reminders,
            'cron',
            hour=10,
            minute=0,
            name='daily_reminders'
        )
        
        # Job to send reminders 1 hour before events
        self.scheduler.add_job(
            self._send_hourly_reminders,
            'cron',
            hour='*',
            minute=0,
            name='hourly_reminders'
        )
        
        # Job to clean up old data (e.g., invitations for past events) weekly
        self.scheduler.add_job(
            self._cleanup_old_data,
            'cron',
            day_of_week=0,  # Monday
            hour=2,
            minute=0,
            name='weekly_cleanup'
        )
    
    async def _send_daily_reminders(self):
        """Send reminders for events happening in the next 24 hours."""
        logger.info("Running daily reminders job")
        await TelegramController.send_upcoming_event_reminders(BASE_URL, 24)
    
    async def _send_hourly_reminders(self):
        """Send reminders for events happening in the next hour."""
        logger.info("Running hourly reminders job")
        await TelegramController.send_upcoming_event_reminders(BASE_URL, 1)
    
    async def _cleanup_old_data(self):
        """Clean up old data."""
        logger.info("Running weekly cleanup job")
        # This would clean up old invitations, etc.
        # Implementation depends on specific requirements
    
    def start(self):
        """Start the scheduler."""
        if not self.scheduler.running:
            self.scheduler.start()
            logger.info("Scheduler started")
    
    def stop(self):
        """Stop the scheduler."""
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("Scheduler stopped")
    
    def get_jobs(self):
        """Get all scheduled jobs."""
        return self.scheduler.get_jobs()

# Singleton instance
scheduler_instance = SchedulerController()

# Function to start the scheduler
def start_scheduler():
    """Start the scheduler."""
    scheduler_instance.start()

# Function to stop the scheduler
def stop_scheduler():
    """Stop the scheduler."""
    scheduler_instance.stop() 