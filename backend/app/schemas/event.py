from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

from .user import UserDisplay

# Event Image Schema
class EventImageBase(BaseModel):
    image_path: str

class EventImageCreate(EventImageBase):
    pass

class EventImageDisplay(EventImageBase):
    id: int
    event_id: int
    
    class Config:
        from_attributes = True
        orm_mode = True  # For backward compatibility

# Event Base Schema
class EventBase(BaseModel):
    title: str
    event_date: datetime
    location: str
    description: Optional[str] = None

# Event Create Schema
class EventCreate(EventBase):
    invited_users: Optional[List[int]] = None

# Event Update Schema
class EventUpdate(BaseModel):
    title: Optional[str] = None
    event_date: Optional[datetime] = None
    location: Optional[str] = None
    description: Optional[str] = None
    existing_images: Optional[List[str]] = None
    invitees: Optional[List[int]] = None

# Event Display Schema
class EventDisplay(EventBase):
    id: int
    creator_id: int
    created_at: datetime
    updated_at: datetime
    is_finished: bool = False
    images: List[str] = []
    
    class Config:
        from_attributes = True
        orm_mode = True  # For backward compatibility

# Event Detail Schema
class EventDetail(EventDisplay):
    creator: UserDisplay
    participants_count: int = 0
    is_user_participant: bool = False
    is_user_invited: bool = False
    
    class Config:
        from_attributes = True
        orm_mode = True  # For backward compatibility

# Participant Schema
class ParticipantBase(BaseModel):
    user_id: int
    event_id: int

class ParticipantCreate(ParticipantBase):
    pass

class ParticipantDisplay(BaseModel):
    id: int
    user: UserDisplay
    event_id: int
    
    class Config:
        from_attributes = True
        orm_mode = True  # For backward compatibility

# Invitation Schema
class InvitationBase(BaseModel):
    user_id: int
    event_id: int

class InvitationCreate(InvitationBase):
    pass

class InvitationDisplay(BaseModel):
    id: int
    user: UserDisplay
    event_id: int
    
    class Config:
        from_attributes = True
        orm_mode = True  # For backward compatibility 