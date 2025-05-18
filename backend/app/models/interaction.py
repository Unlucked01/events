from sqlalchemy import Column, ForeignKey, Integer, Text, Float, CheckConstraint
from sqlalchemy.orm import relationship

from .base import Base, BaseModel

class Comment(Base, BaseModel):
    """Comment model for events."""
    __tablename__ = "comments"
    
    text = Column(Text, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="comments")
    event = relationship("Event", back_populates="comments")

class Review(Base, BaseModel):
    """Review model for events."""
    __tablename__ = "reviews"
    
    text = Column(Text, nullable=True)
    rating = Column(Float, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="reviews")
    event = relationship("Event", back_populates="reviews")
    
    # Ensure rating is between 1 and 5
    __table_args__ = (
        CheckConstraint('rating >= 1 AND rating <= 5', name='check_rating_range'),
    ) 