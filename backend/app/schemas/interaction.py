from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime

from .user import UserDisplay

# Comment Schema
class CommentBase(BaseModel):
    text: str

class CommentCreate(CommentBase):
    pass

class CommentUpdate(CommentBase):
    pass

class CommentDisplay(BaseModel):
    id: int
    text: str
    user: UserDisplay
    event_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True
        orm_mode = True  # For backward compatibility

# Review Schema
class ReviewBase(BaseModel):
    text: Optional[str] = None
    rating: float

    @validator('rating')
    def validate_rating(cls, v):
        if not 1 <= v <= 5:
            raise ValueError('Рейтинг должен быть от 1 до 5')
        return v

class ReviewCreate(ReviewBase):
    pass

class ReviewUpdate(BaseModel):
    text: Optional[str] = None
    rating: Optional[float] = None

    @validator('rating')
    def validate_rating(cls, v):
        if v is not None and not 1 <= v <= 5:
            raise ValueError('Рейтинг должен быть от 1 до 5')
        return v

class ReviewDisplay(BaseModel):
    id: int
    text: Optional[str]
    rating: float
    user: UserDisplay
    event_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True
        orm_mode = True  # For backward compatibility

class ReviewsResponse(BaseModel):
    reviews: List[ReviewDisplay]
    average_rating: float
    
    class Config:
        from_attributes = True
        orm_mode = True  # For backward compatibility 