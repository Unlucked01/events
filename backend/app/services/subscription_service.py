from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from ..models import User
from ..repositories import SubscriptionRepository, UserRepository

class SubscriptionService:
    @staticmethod
    def follow_user(db: Session, followed_id: int, current_user: User):
        """Follow a user."""
        # Check if user exists
        followed_user = UserRepository.get_by_id(db, followed_id)
        if not followed_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Пользователь не найден"
            )
        
        # Check if trying to follow oneself
        if followed_id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Вы не можете подписаться на самого себя"
            )
        
        # Check if already following
        if SubscriptionRepository.is_following(db, current_user.id, followed_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Вы уже подписаны на этого пользователя"
            )
        
        # Create subscription
        subscription = SubscriptionRepository.follow_user(db, current_user.id, followed_id)
        return subscription

    @staticmethod
    def unfollow_user(db: Session, followed_id: int, current_user: User):
        """Unfollow a user."""
        # Check if user exists
        followed_user = UserRepository.get_by_id(db, followed_id)
        if not followed_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Пользователь не найден"
            )
        
        # Check if following
        if not SubscriptionRepository.is_following(db, current_user.id, followed_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Вы не подписаны на этого пользователя"
            )
        
        # Delete subscription
        unfollow_result = SubscriptionRepository.unfollow_user(db, current_user.id, followed_id)
        if not unfollow_result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Не удалось отписаться от пользователя"
            )
        
        return {"status": "success", "message": "Вы успешно отписались"}

    @staticmethod
    def get_followers(db: Session, user_id: int, skip: int = 0, limit: int = 100):
        """Get all followers of a user."""
        # Check if user exists
        user = UserRepository.get_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Пользователь не найден"
            )
        
        # Get followers
        return SubscriptionRepository.get_followers(db, user_id, skip, limit)

    @staticmethod
    def get_following(db: Session, user_id: int, skip: int = 0, limit: int = 100):
        """Get all users a user is following."""
        # Check if user exists
        user = UserRepository.get_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Пользователь не найден"
            )
        
        # Get following
        return SubscriptionRepository.get_following(db, user_id, skip, limit)

    @staticmethod
    def check_is_following(db: Session, followed_id: int, current_user: User):
        """Check if current user is following another user."""
        # Check if user exists
        followed_user = UserRepository.get_by_id(db, followed_id)
        if not followed_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Пользователь не найден"
            )
        
        # Check if following
        is_following = SubscriptionRepository.is_following(db, current_user.id, followed_id)
        return {"is_following": is_following} 