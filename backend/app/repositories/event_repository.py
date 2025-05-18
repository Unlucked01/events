from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any

from ..models import Event, EventImage, EventParticipant, Invitation, User, Subscription
from ..schemas import EventCreate, EventUpdate

class EventRepository:
    @staticmethod
    def create(db: Session, event_data: EventCreate, creator_id: int):
        """Create a new event."""
        db_event = Event(
            title=event_data.title,
            event_date=event_data.event_date,
            location=event_data.location,
            description=event_data.description,
            creator_id=creator_id
        )
        db.add(db_event)
        db.commit()
        db.refresh(db_event)
        return db_event

    @staticmethod
    def add_image(db: Session, event_id: int, image_path: str):
        """Add an image to an event."""
        db_image = EventImage(
            image_path=image_path,
            event_id=event_id
        )
        db.add(db_image)
        db.commit()
        db.refresh(db_image)
        return db_image

    @staticmethod
    def get_by_id(db: Session, event_id: int):
        """Get event by ID."""
        event = db.query(Event).filter(Event.id == event_id).first()
        return event

    @staticmethod
    def update(db: Session, event_id: int, event_data: EventUpdate):
        """Update event."""
        db_event = db.query(Event).filter(Event.id == event_id).first()
        if not db_event:
            return None
        
        # Only update if event has not passed
        now = datetime.now()
        if db_event.event_date < now:
            return None
        
        # Handle existing_images if provided
        existing_images = event_data.existing_images
        if existing_images is not None:
            # Get current image paths for this event
            current_images = [img.image_path for img in db_event.images]
            
            # Find images to delete (images that were in current_images but not in existing_images)
            images_to_delete = [img for img in current_images if img not in existing_images]
            
            # Delete images that are no longer in the existing_images list
            if images_to_delete:
                for image_path in images_to_delete:
                    db_image = db.query(EventImage).filter(
                        EventImage.event_id == event_id,
                        EventImage.image_path == image_path
                    ).first()
                    if db_image:
                        db.delete(db_image)
        
        # Remove existing_images from update_data as it's not a direct event attribute
        update_data = event_data.dict(exclude_unset=True)
        if 'existing_images' in update_data:
            del update_data['existing_images']
        
        # Update remaining fields
        for key, value in update_data.items():
            setattr(db_event, key, value)
        
        db.commit()
        db.refresh(db_event)
        return db_event

    @staticmethod
    def delete(db: Session, event_id: int):
        """Delete event."""
        db_event = db.query(Event).filter(Event.id == event_id).first()
        if db_event:
            db.delete(db_event)
            db.commit()
            return True
        return False

    @staticmethod
    def delete_image(db: Session, image_id: int):
        """Delete an event image."""
        db_image = db.query(EventImage).filter(EventImage.id == image_id).first()
        if db_image:
            db.delete(db_image)
            db.commit()
            return True
        return False

    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100, upcoming_only: bool = False) -> List[Dict[str, Any]]:
        """Get all events."""
        query = db.query(Event)
        
        if upcoming_only:
            now = datetime.now()
            query = query.filter(Event.event_date >= now)
        
        events = query.order_by(desc(Event.created_at)).offset(skip).limit(limit).all()
        
        # Convert events to dictionaries with serialized image paths
        return [event.to_dict() for event in events]

    @staticmethod
    def get_events_by_creator(db: Session, creator_id: int, skip: int = 0, limit: int = 100) -> List[Event]:
        """Get events by creator ID."""
        events = db.query(Event).filter(
            Event.creator_id == creator_id
        ).order_by(desc(Event.created_at)).offset(skip).limit(limit).all()
        return events

    @staticmethod
    def get_upcoming_events_by_creator(db: Session, creator_id: int, skip: int = 0, limit: int = 100) -> List[Event]:
        """Get upcoming events by creator ID."""
        now = datetime.now()
        events = db.query(Event).filter(
            Event.creator_id == creator_id,
            Event.event_date >= now
        ).order_by(Event.event_date).offset(skip).limit(limit).all()
        return events

    @staticmethod
    def get_user_feed(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Event]:
        """Get events from users the current user is following."""
        # Get IDs of users the current user is following
        following_ids = db.query(Subscription.followed_id).filter(
            Subscription.follower_id == user_id
        ).all()
        following_ids = [followed_id for (followed_id,) in following_ids]
        
        if not following_ids:
            return []
        
        events = db.query(Event).filter(
            Event.creator_id.in_(following_ids)
        ).order_by(desc(Event.created_at)).offset(skip).limit(limit).all()
        return events

    @staticmethod
    def search(db: Session, query: str, skip: int = 0, limit: int = 100, upcoming_only: bool = False) -> List[Event]:
        """Search events by title or location."""
        search_query = f"%{query}%"
        base_query = db.query(Event).filter(
            (Event.title.ilike(search_query)) | 
            (Event.location.ilike(search_query)) |
            (Event.description.ilike(search_query))
        )
        
        if upcoming_only:
            now = datetime.now()
            base_query = base_query.filter(Event.event_date >= now)
        
        events = base_query.order_by(desc(Event.created_at)).offset(skip).limit(limit).all()
        return events

    @staticmethod
    def get_participants_count(db: Session, event_id: int):
        """Get the number of participants for an event."""
        return db.query(func.count(EventParticipant.id)).filter(
            EventParticipant.event_id == event_id
        ).scalar()

    @staticmethod
    def is_user_participant(db: Session, event_id: int, user_id: int):
        """Check if a user is a participant of an event."""
        participant = db.query(EventParticipant).filter(
            EventParticipant.event_id == event_id,
            EventParticipant.user_id == user_id
        ).first()
        return participant is not None

    @staticmethod
    def is_user_invited(db: Session, event_id: int, user_id: int):
        """Check if a user is invited to an event."""
        invitation = db.query(Invitation).filter(
            Invitation.event_id == event_id,
            Invitation.user_id == user_id
        ).first()
        return invitation is not None

    @staticmethod
    def get_events_by_date(db: Session, date: datetime, skip: int = 0, limit: int = 100) -> List[Event]:
        """Get events occurring on a specific date."""
        # Get events where the date part matches
        events = db.query(Event).filter(
            func.date(Event.event_date) == func.date(date)
        ).order_by(Event.event_date).offset(skip).limit(limit).all()
        return events

    @staticmethod
    def get_events_in_next_24_hours(db: Session) -> List[Event]:
        """Get events occurring in the next 24 hours."""
        now = datetime.now()
        future = now + timedelta(days=1)
        events = db.query(Event).filter(
            Event.event_date >= now,
            Event.event_date <= future
        ).all()
        return events 