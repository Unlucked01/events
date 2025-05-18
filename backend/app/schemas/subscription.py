from pydantic import BaseModel
from datetime import datetime

from .user import UserDisplay

# Subscription Schema
class SubscriptionBase(BaseModel):
    followed_id: int

class SubscriptionCreate(SubscriptionBase):
    pass

class SubscriptionDisplay(BaseModel):
    id: int
    follower: UserDisplay
    followed: UserDisplay
    created_at: datetime
    
    class Config:
        from_attributes = True
        orm_mode = True  # For backward compatibility 