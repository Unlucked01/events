from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import json
import logging

# Configure logger
logger = logging.getLogger(__name__)

from ..config.database import get_db
from ..utils.security import get_current_active_user, get_current_user
from ..services import EventService, ParticipationService, InvitationService, CommentService, ReviewService
from ..schemas import (
    EventCreate, EventUpdate, EventDisplay, EventDetail, 
    CommentCreate, CommentUpdate, CommentDisplay,
    ReviewCreate, ReviewUpdate, ReviewDisplay, ReviewsResponse, ParticipantDisplay, InvitationDisplay
)
from ..models import User
from ..controllers.telegram_controller import TelegramController

router = APIRouter(
    prefix="/api/events",
    tags=["events"],
    responses={401: {"description": "Unauthorized"}},
)

# Get base URL from environment variables
import os
from dotenv import load_dotenv
load_dotenv()
BASE_URL = os.getenv("BASE_URL", "http://localhost:3000")

# Helper function to parse JSON string from form data
def parse_json_field(field: str, default=None):
    if not field:
        return default
    try:
        return json.loads(field)
    except json.JSONDecodeError:
        return default

@router.post("", response_model=EventDisplay, status_code=status.HTTP_201_CREATED)
async def create_event(
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    event_date: datetime = Form(...),
    location: str = Form(...),
    description: str = Form(None),
    invited_users: str = Form(None),  # JSON string of user IDs
    images: List[UploadFile] = File(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new event."""
    # Parse invited users
    invited_users_list = parse_json_field(invited_users, default=[])
    
    # Create event data
    event_data = EventCreate(
        title=title,
        event_date=event_date,
        location=location,
        description=description,
        invited_users=invited_users_list
    )
    
    # Create event
    event = await EventService.create_event(db, event_data, images, current_user)
    
    # Send invitations in the background
    background_tasks.add_task(
        TelegramController.send_bulk_invitations,
        event['id'],
        BASE_URL
    )
    
    # Notify followers about the new event
    background_tasks.add_task(
        TelegramController.notify_followers_about_event,
        current_user.id,
        event['id'],
        BASE_URL
    )
    
    return event

@router.get("", response_model=List[EventDisplay])
async def get_events(
    skip: int = 0,
    limit: int = 10,
    upcoming_only: bool = False,
    db: Session = Depends(get_db)
):
    """Get all events."""
    from ..repositories import EventRepository
    return EventRepository.get_all(db, skip, limit, upcoming_only)

@router.get("/feed", response_model=List[EventDisplay])
async def get_event_feed(
    skip: int = 0,
    limit: int = 10,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get event feed for current user."""
    return EventService.get_user_feed(db, current_user.id, skip, limit)

@router.get("/search", response_model=List[EventDisplay])
async def search_events(
    query: str = Query(..., min_length=3),
    upcoming_only: bool = False,
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Search events by title, location, or description."""
    return EventService.search_events(db, query, upcoming_only, skip, limit)

@router.get("/users/{user_id}", response_model=List[EventDisplay])
async def get_user_events(
    user_id: int,
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get events created by a specific user."""
    return EventService.get_user_events(db, user_id, skip, limit)

@router.get("/{event_id}", response_model=EventDetail)
async def get_event(
    event_id: int,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get event by ID."""
    try:
        return EventService.get_event_by_id(db, event_id, current_user)
    except HTTPException as e:
        # Pass through HTTP exceptions
        raise e
    except Exception as e:
        # Log the error and return a useful response
        logger.error(f"Error getting event {event_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving event: {str(e)}"
        )

@router.put("/{event_id}", response_model=EventDisplay)
async def update_event(
    event_id: int,
    background_tasks: BackgroundTasks,
    title: Optional[str] = Form(None),
    event_date: Optional[datetime] = Form(None),
    location: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    existing_images: Optional[str] = Form(None),
    invited_users: Optional[str] = Form(None),
    images: List[UploadFile] = File(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update an event."""
    # Parse existing images and invited users
    existing_images_list = parse_json_field(existing_images, default=[])
    invited_users_list = parse_json_field(invited_users, default=[])
    
    # Create update data
    event_data = EventUpdate(
        title=title,
        event_date=event_date,
        location=location,
        description=description,
        existing_images=existing_images_list,
        invitees=invited_users_list
    )
    
    # Update event
    event = await EventService.update_event(db, event_id, event_data, current_user)
    
    # Add new images if provided
    if images:
        for image in images:
            if image.content_type.startswith('image/'):
                await EventService.add_event_image(db, event_id, image, current_user)
    
    # Notify followers about the updated event
    background_tasks.add_task(
        TelegramController.notify_followers_about_event,
        current_user.id,
        event_id,
        BASE_URL,
        is_update=True
    )
    
    # Get the updated event
    return await EventService.get_event_by_id(db, event_id, current_user)

@router.post("/{event_id}/images", response_model=EventDetail)
async def upload_event_image(
    event_id: int,
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload image for an event."""
    try:
        # Check if image is valid
        if not image.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Файл должен быть изображением"
            )
        
        return await EventService.add_event_image(db, event_id, image, current_user)
    except Exception as e:
        # Log the error for debugging
        logger.error(f"Error uploading image: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при загрузке изображения: {str(e)}"
        )

@router.delete("/{event_id}/images/{image_id}", status_code=status.HTTP_200_OK)
async def delete_event_image(
    event_id: int,
    image_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete an event image."""
    return await EventService.delete_event_image(db, image_id, current_user)

@router.delete("/{event_id}", status_code=status.HTTP_200_OK)
async def delete_event(
    event_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete an event."""
    return await EventService.delete_event(db, event_id, current_user)

# Participation routes
@router.post("/{event_id}/join", response_model=ParticipantDisplay)
async def join_event(
    event_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Join an event."""
    return ParticipationService.join_event(db, event_id, current_user)

@router.delete("/{event_id}/leave", status_code=status.HTTP_200_OK)
async def leave_event(
    event_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Leave an event."""
    return ParticipationService.leave_event(db, event_id, current_user)

@router.get("/{event_id}/participants", response_model=List[ParticipantDisplay])
async def get_event_participants(
    event_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all participants for an event."""
    return ParticipationService.get_event_participants(db, event_id, skip, limit)

# Invitation routes
@router.post("/{event_id}/invite/{user_id}", response_model=InvitationDisplay)
async def invite_user(
    event_id: int,
    user_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Invite a user to an event."""
    invitation = InvitationService.create_invitation(db, event_id, user_id, current_user)
    
    # Send invitation in the background
    background_tasks.add_task(
        TelegramController.send_event_invitation,
        user_id,
        event_id,
        BASE_URL
    )
    
    return invitation

@router.delete("/{event_id}/invitations/{invitation_id}", status_code=status.HTTP_200_OK)
async def delete_invitation(
    event_id: int,
    invitation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete an invitation."""
    return InvitationService.delete_invitation(db, invitation_id, current_user)

@router.get("/{event_id}/invitations", response_model=List[InvitationDisplay])
async def get_event_invitations(
    event_id: int,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all invitations for an event."""
    return InvitationService.get_event_invitations(db, event_id, current_user, skip, limit)

# Comment routes
@router.post("/{event_id}/comments", response_model=CommentDisplay)
async def create_comment(
    event_id: int,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new comment."""
    return CommentService.create_comment(db, comment_data, event_id, current_user)

@router.put("/comments/{comment_id}", response_model=CommentDisplay)
async def update_comment(
    comment_id: int,
    comment_data: CommentUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a comment."""
    return CommentService.update_comment(db, comment_id, comment_data, current_user)

@router.delete("/comments/{comment_id}", status_code=status.HTTP_200_OK)
async def delete_comment(
    comment_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a comment."""
    return CommentService.delete_comment(db, comment_id, current_user)

@router.get("/{event_id}/comments", response_model=List[CommentDisplay])
async def get_event_comments(
    event_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all comments for an event."""
    return CommentService.get_event_comments(db, event_id, skip, limit)

# Review routes
@router.post("/{event_id}/reviews", response_model=ReviewDisplay)
async def create_review(
    event_id: int,
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new review."""
    return ReviewService.create_review(db, event_id, review_data, current_user)

@router.put("/reviews/{review_id}", response_model=ReviewDisplay)
async def update_review(
    review_id: int,
    review_data: ReviewUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a review."""
    return ReviewService.update_review(db, review_id, review_data, current_user)

@router.delete("/reviews/{review_id}", status_code=status.HTTP_200_OK)
async def delete_review(
    review_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a review."""
    return ReviewService.delete_review(db, review_id, current_user)

@router.get("/{event_id}/reviews", response_model=ReviewsResponse)
async def get_event_reviews(
    event_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all reviews for an event."""
    return ReviewService.get_event_reviews(db, event_id, skip, limit) 