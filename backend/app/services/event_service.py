from sqlalchemy.orm import Session
from fastapi import HTTPException, status, UploadFile
from typing import List, Optional, Dict, Any
from datetime import datetime

from ..models import User, Event
from ..repositories import EventRepository, InvitationRepository, SubscriptionRepository
from ..schemas import EventCreate, EventUpdate, EventDetail
from ..utils.upload import save_image, delete_file

class EventService:
    @staticmethod
    async def create_event(
        db: Session, 
        event_data: EventCreate, 
        images: Optional[List[UploadFile]], 
        current_user: User
    ):
        """Create a new event."""
        # Create event
        event = EventRepository.create(db, event_data, current_user.id)
        
        # Add images if provided
        if images:
            for image in images:
                image_path = await save_image(image, folder="events")
                EventRepository.add_image(db, event.id, image_path)
        
        # Create invitations for followers if not explicitly specified
        if event_data.invited_users is None:
            InvitationRepository.create_invitations_for_followers(db, event.id, current_user.id)
        # Create invitations for specified users
        elif event_data.invited_users:
            for user_id in event_data.invited_users:
                InvitationRepository.create_invitation(db, event.id, user_id)
        
        # Refresh the event to get the images
        db.refresh(event)
        return event.to_dict()

    @staticmethod
    def get_event_by_id(db: Session, event_id: int, current_user: Optional[User] = None):
        """Get event by ID with additional details."""
        event = EventRepository.get_by_id(db, event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Мероприятие не найдено"
            )
        
        # Create event detail dict
        event_dict = event.to_dict()
        
        # Add creator info
        event_dict["creator"] = {
            "id": event.creator.id,
            "username": event.creator.username,
            "full_name": event.creator.full_name,
            "phone": event.creator.phone or "",  # Ensure phone is never null
            "created_at": event.creator.created_at.isoformat() if event.creator.created_at else datetime.now().isoformat(),  # Ensure created_at is never null
            "profile_picture": event.creator.profile_picture
        }
        
        # Get participants count
        event_dict["participants_count"] = EventRepository.get_participants_count(db, event_id)
        
        # Check if current user is participant and invited if user is logged in
        if current_user:
            event_dict["is_user_participant"] = EventRepository.is_user_participant(db, event_id, current_user.id)
            event_dict["is_user_invited"] = EventRepository.is_user_invited(db, event_id, current_user.id)
        else:
            event_dict["is_user_participant"] = False
            event_dict["is_user_invited"] = False
        
        return event_dict

    @staticmethod
    async def update_event(
        db: Session, 
        event_id: int, 
        event_data: EventUpdate, 
        current_user: User
    ):
        """Update an event."""
        # Get event
        event = EventRepository.get_by_id(db, event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Мероприятие не найдено"
            )
        
        # Check if user is the creator
        if event.creator_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="У вас нет прав на редактирование этого мероприятия"
            )
        
        # Check if event has already passed
        if event.event_date < datetime.now():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Нельзя редактировать прошедшее мероприятие"
            )
        
        # Handle deleted images - if existing_images is provided
        if event_data.existing_images is not None:
            # Get current images
            current_images = [img.image_path for img in event.images]
            
            # Find images to delete
            images_to_delete = [path for path in current_images if path not in event_data.existing_images]
            
            # Delete the image files
            for image_path in images_to_delete:
                await delete_file(image_path)
        
        # Update event
        updated_event = EventRepository.update(db, event_id, event_data)
        return updated_event.to_dict()

    @staticmethod
    async def add_event_image(
        db: Session, 
        event_id: int, 
        image: UploadFile, 
        current_user: User
    ):
        """Add an image to an event."""
        # Get event
        event = EventRepository.get_by_id(db, event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Мероприятие не найдено"
            )
        
        # Check if user is the creator
        if event.creator_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="У вас нет прав на редактирование этого мероприятия"
            )
        
        # Check if event has already passed
        if event.event_date < datetime.now():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Нельзя редактировать прошедшее мероприятие"
            )
        
        # Save image
        image_path = await save_image(image, folder="events")
        
        # Add image to event
        event_image = EventRepository.add_image(db, event_id, image_path)
        return event_image

    @staticmethod
    async def delete_event(db: Session, event_id: int, current_user: User):
        """Delete an event."""
        # Get event
        event = EventRepository.get_by_id(db, event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Мероприятие не найдено"
            )
        
        # Check if user is the creator
        if event.creator_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="У вас нет прав на удаление этого мероприятия"
            )
        
        # Delete images
        for image in event.images:
            await delete_file(image.image_path)
        
        # Delete event
        EventRepository.delete(db, event_id)
        return {"status": "success", "message": "Мероприятие успешно удалено"}

    @staticmethod
    async def delete_event_image(db: Session, image_id: int, current_user: User):
        """Delete an event image."""
        # Check if image exists and get the event
        from ..models import EventImage
        image = db.query(EventImage).filter(EventImage.id == image_id).first()
        if not image:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Изображение не найдено"
            )
        
        # Get event
        event = EventRepository.get_by_id(db, image.event_id)
        
        # Check if user is the creator
        if event.creator_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="У вас нет прав на удаление изображений этого мероприятия"
            )
        
        # Delete image file
        await delete_file(image.image_path)
        
        # Delete image from database
        EventRepository.delete_image(db, image_id)
        return {"status": "success", "message": "Изображение успешно удалено"}

    @staticmethod
    def get_user_events(db: Session, user_id: int, skip: int = 0, limit: int = 10):
        """Get events created by a user."""
        events = EventRepository.get_events_by_creator(db, user_id, skip, limit)
        return [event.to_dict() for event in events]

    @staticmethod
    def get_user_feed(db: Session, user_id: int, skip: int = 0, limit: int = 10):
        """Get events from users the current user is following."""
        events = EventRepository.get_user_feed(db, user_id, skip, limit)
        return [event.to_dict() for event in events]

    @staticmethod
    def search_events(db: Session, query: str, upcoming_only: bool = False, skip: int = 0, limit: int = 10):
        """Search events by title, location, or description."""
        if not query or len(query) < 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Поисковый запрос должен содержать не менее 3 символов"
            )
        
        events = EventRepository.search(db, query, skip, limit, upcoming_only)
        return [event.to_dict() for event in events]

    @staticmethod
    def prepare_events_for_response(events: List[Event]) -> List[Dict[str, Any]]:
        """Convert Event models to dictionaries with serialized image paths."""
        return [event.to_dict() for event in events] 