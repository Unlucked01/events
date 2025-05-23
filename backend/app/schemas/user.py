from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime

# Base User Schema
class UserBase(BaseModel):
    username: str
    full_name: str
    phone: str

# User Creation Schema
class UserCreate(UserBase):
    password: str
    
    @validator('password')
    def password_strength(cls, v):
        if len(v) < 6:
            raise ValueError('Пароль должен содержать минимум 6 символов')
        return v

# User Update Schema
class UserUpdate(BaseModel):
    username: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    profile_picture: Optional[str] = None
    password: Optional[str] = None

# User Display Schema
class UserDisplay(UserBase):
    id: int
    profile_picture: Optional[str] = None
    created_at: datetime
    telegram_chat_id: Optional[str] = None
    
    class Config:
        from_attributes = True
        orm_mode = True  # Для обратной совместимости

# User Detail Schema with counts
class UserDetail(UserDisplay):
    events_count: int = 0
    followers_count: int = 0
    following_count: int = 0
    
    class Config:
        from_attributes = True
        orm_mode = True  # Для обратной совместимости

# User Login Schema
class UserLogin(BaseModel):
    username: str
    password: str

# Token Schema
class Token(BaseModel):
    access_token: str
    token_type: str

# Token Data Schema
class TokenData(BaseModel):
    username: Optional[str] = None 