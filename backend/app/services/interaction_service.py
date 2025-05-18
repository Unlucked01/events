from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime

from ..models import User, Review
from ..repositories import CommentRepository, ReviewRepository, EventRepository
from ..schemas import CommentCreate, CommentUpdate, ReviewCreate, ReviewUpdate

class CommentService:
    @staticmethod
    def create_comment(db: Session, comment_data: CommentCreate, event_id: int, current_user: User):
        """Create a new comment."""
        # Check if event exists
        event = EventRepository.get_by_id(db, event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Мероприятие не найдено"
            )
        
        # Create comment with event_id
        comment = CommentRepository.create(db, comment_data, event_id, current_user.id)
        return comment

    @staticmethod
    def update_comment(db: Session, comment_id: int, comment_data: CommentUpdate, current_user: User):
        """Update a comment."""
        # Update comment
        updated_comment = CommentRepository.update(db, comment_id, comment_data, current_user.id)
        if not updated_comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Комментарий не найден или у вас нет прав на его редактирование"
            )
        
        return updated_comment

    @staticmethod
    def delete_comment(db: Session, comment_id: int, current_user: User):
        """Delete a comment."""
        # Delete comment
        deleted = CommentRepository.delete(db, comment_id, current_user.id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Комментарий не найден или у вас нет прав на его удаление"
            )
        
        return {"status": "success", "message": "Комментарий успешно удален"}

    @staticmethod
    def get_event_comments(db: Session, event_id: int, skip: int = 0, limit: int = 100):
        """Get all comments for an event."""
        # Check if event exists
        event = EventRepository.get_by_id(db, event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Мероприятие не найдено"
            )
        
        # Get comments
        return CommentRepository.get_by_event(db, event_id, skip, limit)

class ReviewService:
    @staticmethod
    def create_review(db: Session, event_id: int, review_data: ReviewCreate, current_user: User):
        """Create a new review."""
        # Check if event exists
        event = EventRepository.get_by_id(db, event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Мероприятие не найдено"
            )
        
        # Check if event has passed
        if event.event_date > datetime.now():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Нельзя оставить отзыв о мероприятии, которое еще не прошло"
            )
        
        # Check if user has already reviewed
        existing_review = db.query(Review).filter(
            Review.event_id == event_id,
            Review.user_id == current_user.id
        ).first()
        
        if existing_review:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Вы уже оставили отзыв о данном мероприятии"
            )
        
        # Create review
        review = ReviewRepository.create(db, event_id, review_data, current_user.id)
        if not review:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Не удалось создать отзыв"
            )
        
        return review

    @staticmethod
    def update_review(db: Session, review_id: int, review_data: ReviewUpdate, current_user: User):
        """Update a review."""
        # Update review
        updated_review = ReviewRepository.update(db, review_id, review_data, current_user.id)
        if not updated_review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Отзыв не найден или у вас нет прав на его редактирование"
            )
        
        return updated_review

    @staticmethod
    def delete_review(db: Session, review_id: int, current_user: User):
        """Delete a review."""
        # Delete review
        deleted = ReviewRepository.delete(db, review_id, current_user.id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Отзыв не найден или у вас нет прав на его удаление"
            )
        
        return {"status": "success", "message": "Отзыв успешно удален"}

    @staticmethod
    def get_event_reviews(db: Session, event_id: int, skip: int = 0, limit: int = 100):
        """Get all reviews for an event."""
        # Check if event exists
        event = EventRepository.get_by_id(db, event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Мероприятие не найдено"
            )
        
        # Get reviews
        reviews = ReviewRepository.get_by_event(db, event_id, skip, limit)
        
        # Get average rating
        avg_rating = ReviewRepository.get_average_rating(db, event_id)
        
        return {
            "reviews": reviews,
            "average_rating": avg_rating
        } 