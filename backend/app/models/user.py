from sqlalchemy import Column, String, Boolean
from sqlalchemy.orm import relationship

from .base import Base, BaseModel

class User(Base, BaseModel):
    """User model."""
    __tablename__ = "users"
    
    username = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    profile_picture = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    telegram_chat_id = Column(String, nullable=True)
    telegram_username = Column(String, nullable=True)  # Telegram username for sending invitations
    
    # Relationships
    events = relationship("Event", back_populates="creator", cascade="all, delete-orphan")
    participations = relationship("EventParticipant", back_populates="user", cascade="all, delete-orphan")
    invitations = relationship("Invitation", back_populates="user", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")
    
    # Followers relationship (many-to-many)
    followers = relationship(
        "Subscription",
        foreign_keys="Subscription.followed_id",
        back_populates="followed",
        cascade="all, delete-orphan"
    )
    
    # Following relationship (many-to-many)
    following = relationship(
        "Subscription",
        foreign_keys="Subscription.follower_id",
        back_populates="follower",
        cascade="all, delete-orphan"
    ) 