import os
import asyncio
from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import logging
from dotenv import load_dotenv
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

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

# Ensure static directory exists
static_dir = "/app/static"  # Используем абсолютный путь
uploads_dir = os.path.join(static_dir, "uploads")
events_dir = os.path.join(uploads_dir, "events")

for directory in [static_dir, uploads_dir, events_dir]:
    os.makedirs(directory, exist_ok=True)

# Mount static files with correct path
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Include routers
app.include_router(router)

# Add middleware to limit request size
class LimitUploadSizeMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_upload_size: int):
        super().__init__(app)
        self.max_upload_size = max_upload_size

    async def dispatch(self, request: Request, call_next):
        if request.method == "POST" or request.method == "PUT":
            content_length = request.headers.get("content-length")
            if content_length:
                content_length = int(content_length)
                if content_length > self.max_upload_size:
                    raise HTTPException(
                        status_code=413,
                        detail=f"Request entity too large. Maximum size is {self.max_upload_size} bytes"
                    )
        
        response = await call_next(request)
        return response

# Add upload size limit middleware (50MB)
app.add_middleware(LimitUploadSizeMiddleware, max_upload_size=50 * 1024 * 1024)

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