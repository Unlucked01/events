from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Integer
from sqlalchemy.orm import relationship
from typing import Dict, Any, List

from .base import Base, BaseModel

class Event(Base, BaseModel):
    """Event model."""
    __tablename__ = "events"
    
    title = Column(String, nullable=False)
    event_date = Column(DateTime, nullable=False)
    location = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    creator_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Relationships
    creator = relationship("User", back_populates="events")
    images = relationship("EventImage", back_populates="event", cascade="all, delete-orphan")
    participants = relationship("EventParticipant", back_populates="event", cascade="all, delete-orphan")
    invitations = relationship("Invitation", back_populates="event", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="event", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="event", cascade="all, delete-orphan")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert event to dictionary with serialized image paths."""
        result = {
            "id": self.id,
            "title": self.title,
            "event_date": self.event_date,
            "location": self.location,
            "description": self.description,
            "creator_id": self.creator_id,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "images": [img.image_path for img in self.images] if self.images else []
        }
        
        # Add is_finished field based on event date
        from datetime import datetime
        result["is_finished"] = self.event_date < datetime.now()
        
        return result

class EventImage(Base, BaseModel):
    """Event image model."""
    __tablename__ = "event_images"
    
    image_path = Column(String, nullable=False)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    
    # Relationships
    event = relationship("Event", back_populates="images")

class EventParticipant(Base, BaseModel):
    """Event participant model."""
    __tablename__ = "event_participants"
    
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="participations")
    event = relationship("Event", back_populates="participants")

class Invitation(Base, BaseModel):
    """Invitation model."""
    __tablename__ = "invitations"
    
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="invitations")
    event = relationship("Event", back_populates="invitations") 