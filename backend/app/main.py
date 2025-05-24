import os
import asyncio
from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import logging
from dotenv import load_dotenv

from .routers import router
from .config.database import Base, engine, get_db
from .models import User, Event, EventImage, EventParticipant, Invitation, Subscription, Comment, Review
from .controllers import start_bot, stop_bot, start_scheduler, stop_scheduler

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Сервис организации мероприятий и встреч",
    description="API для управления мероприятиями, подписками и уведомлениями",
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Include routers
app.include_router(router)

# Event handlers
@app.on_event("startup")
async def startup_event():
    """Create tables and start services on startup."""
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created")
    
    # Start Telegram bot
    asyncio.create_task(start_bot())
    logger.info("Telegram bot started")
    
    # Start scheduler
    start_scheduler()
    logger.info("Scheduler started")

@app.on_event("shutdown")
async def shutdown_event():
    """Stop services on shutdown."""
    # Stop Telegram bot
    await stop_bot()
    logger.info("Telegram bot stopped")
    
    # Stop scheduler
    stop_scheduler()
    logger.info("Scheduler stopped")

# Root endpoint
@app.get("/", tags=["root"])
async def root():
    """Root endpoint."""
    return {
        "message": "Добро пожаловать в API сервиса организации мероприятий",
        "documentation": "/docs"
    }

# Health check endpoint
@app.get("/health", tags=["health"])
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint."""
    try:
        # Check database connection
        db.execute("SELECT 1")
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    return {
        "status": "ok",
        "database": db_status
    }

# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"message": "Внутренняя ошибка сервера"}
    ) 