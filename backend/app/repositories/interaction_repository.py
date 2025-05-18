from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime

from ..models import Comment, Review, Event
from ..schemas import CommentCreate, CommentUpdate, ReviewCreate, ReviewUpdate

class CommentRepository:
    @staticmethod
    def create(db: Session, comment_data: CommentCreate, event_id: int, user_id: int):
        """Create a new comment."""
        db_comment = Comment(
            text=comment_data.text,
            event_id=event_id,
            user_id=user_id
        )
        db.add(db_comment)
        db.commit()
        db.refresh(db_comment)
        return db_comment

    @staticmethod
    def get_by_id(db: Session, comment_id: int):
        """Get comment by ID."""
        return db.query(Comment).filter(Comment.id == comment_id).first()

    @staticmethod
    def update(db: Session, comment_id: int, comment_data: CommentUpdate, user_id: int):
        """Update comment."""
        db_comment = db.query(Comment).filter(
            Comment.id == comment_id,
            Comment.user_id == user_id
        ).first()
        
        if not db_comment:
            return None
        
        # Update fields
        update_data = comment_data.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_comment, key, value)
        
        db.commit()
        db.refresh(db_comment)
        return db_comment

    @staticmethod
    def delete(db: Session, comment_id: int, user_id: int):
        """Delete comment."""
        db_comment = db.query(Comment).filter(
            Comment.id == comment_id,
            Comment.user_id == user_id
        ).first()
        
        if db_comment:
            db.delete(db_comment)
            db.commit()
            return True
        return False

    @staticmethod
    def get_by_event(db: Session, event_id: int, skip: int = 0, limit: int = 100):
        """Get comments for an event."""
        return db.query(Comment).filter(
            Comment.event_id == event_id
        ).order_by(desc(Comment.created_at)).offset(skip).limit(limit).all()

class ReviewRepository:
    @staticmethod
    def create(db: Session, event_id: int, review_data: ReviewCreate, user_id: int):
        """Create a new review."""
        # Check if the event has already passed
        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            return None
            
        # Compare with Python datetime objects instead of using func.now()
        current_time = datetime.now()
        if event.event_date > current_time:
            return None
        
        # Check if user has already reviewed this event
        existing_review = db.query(Review).filter(
            Review.event_id == event_id,
            Review.user_id == user_id
        ).first()
        
        if existing_review:
            return None
        
        db_review = Review(
            text=review_data.text,
            rating=review_data.rating,
            event_id=event_id,
            user_id=user_id
        )
        db.add(db_review)
        db.commit()
        db.refresh(db_review)
        return db_review

    @staticmethod
    def get_by_id(db: Session, review_id: int):
        """Get review by ID."""
        return db.query(Review).filter(Review.id == review_id).first()

    @staticmethod
    def update(db: Session, review_id: int, review_data: ReviewUpdate, user_id: int):
        """Update review."""
        db_review = db.query(Review).filter(
            Review.id == review_id,
            Review.user_id == user_id
        ).first()
        
        if not db_review:
            return None
        
        # Update fields
        update_data = review_data.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_review, key, value)
        
        db.commit()
        db.refresh(db_review)
        return db_review

    @staticmethod
    def delete(db: Session, review_id: int, user_id: int):
        """Delete review."""
        db_review = db.query(Review).filter(
            Review.id == review_id,
            Review.user_id == user_id
        ).first()
        
        if db_review:
            db.delete(db_review)
            db.commit()
            return True
        return False

    @staticmethod
    def get_by_event(db: Session, event_id: int, skip: int = 0, limit: int = 100):
        """Get reviews for an event."""
        return db.query(Review).filter(
            Review.event_id == event_id
        ).order_by(desc(Review.created_at)).offset(skip).limit(limit).all()

    @staticmethod
    def get_average_rating(db: Session, event_id: int):
        """Get average rating for an event."""
        result = db.query(func.avg(Review.rating)).filter(
            Review.event_id == event_id
        ).scalar()
        return result if result else 0.0 