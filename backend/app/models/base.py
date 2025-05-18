from sqlalchemy import Column, Integer, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

from app.config.database import Base 


class TimeStampedModel:
    """Base model with timestamp fields."""
    __abstract__ = True
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
class BaseModel(TimeStampedModel):
    __abstract__ = True  # ← ОБЯЗАТЕЛЬНО
    id = Column(Integer, primary_key=True, index=True)