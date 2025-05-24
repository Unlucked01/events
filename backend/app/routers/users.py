from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..config.database import get_db
from ..utils.security import get_current_active_user
from ..services import UserService, SubscriptionService
from ..schemas import UserDisplay, UserDetail, UserUpdate, SubscriptionDisplay
from ..models import User

router = APIRouter(
    prefix="/users",
    tags=["users"],
    responses={401: {"description": "Unauthorized"}},
)

@router.get("/me", response_model=UserDetail)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user profile."""
    user = UserService.get_user_by_id(db, current_user.id)
    print('User from DB:', user.__dict__)
    return user

@router.get("/{user_id}", response_model=UserDetail)
async def get_user_profile(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get user profile by ID."""
    return UserService.get_user_by_id(db, user_id)

@router.put("/me", response_model=UserDisplay)
async def update_profile(
    username: str = Form(None),
    full_name: str = Form(None),
    phone: str = Form(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user profile."""
    # Create user data schema from form fields
    user_data = UserUpdate(
        username=username, 
        full_name=full_name,
        phone=phone
    )
    return await UserService.update_user(db, current_user.id, user_data, current_user)

@router.put("/me/profile-picture", response_model=UserDisplay)
async def update_profile_picture(
    profile_picture: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user profile picture."""
    return await UserService.update_profile_picture(db, current_user.id, profile_picture, current_user)

@router.get("/search", response_model=List[UserDisplay])
async def search_users(
    query: str = Query(..., min_length=3),
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Search users by username, phone, or full name."""
    return UserService.search_users(db, query, skip, limit)

# Subscription routes
@router.post("/{user_id}/follow", response_model=SubscriptionDisplay)
async def follow_user(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Follow a user."""
    return SubscriptionService.follow_user(db, user_id, current_user)

@router.delete("/{user_id}/unfollow", status_code=status.HTTP_200_OK)
async def unfollow_user(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Unfollow a user."""
    return SubscriptionService.unfollow_user(db, user_id, current_user)

@router.get("/{user_id}/followers", response_model=List[SubscriptionDisplay])
async def get_followers(
    user_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all followers of a user."""
    return SubscriptionService.get_followers(db, user_id, skip, limit)

@router.get("/{user_id}/following", response_model=List[SubscriptionDisplay])
async def get_following(
    user_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all users a user is following."""
    return SubscriptionService.get_following(db, user_id, skip, limit)

@router.get("/{user_id}/is-following")
async def check_is_following(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Check if current user is following another user."""
    return SubscriptionService.check_is_following(db, user_id, current_user) 