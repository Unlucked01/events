from sqlalchemy import Column, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import relationship

from .base import Base, BaseModel

class Subscription(Base, BaseModel):
    """Subscription model for following users."""
    __tablename__ = "subscriptions"
    
    follower_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    followed_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Relationships
    follower = relationship("User", foreign_keys=[follower_id], back_populates="following")
    followed = relationship("User", foreign_keys=[followed_id], back_populates="followers")
    
    # Ensure a user can only follow another user once
    __table_args__ = (
        UniqueConstraint('follower_id', 'followed_id', name='unique_follower_followed'),
    ) 