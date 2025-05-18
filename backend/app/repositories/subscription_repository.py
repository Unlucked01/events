from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from ..models import Subscription, User

class SubscriptionRepository:
    @staticmethod
    def follow_user(db: Session, follower_id: int, followed_id: int):
        """Create a subscription (follow a user)."""
        # Check if already following
        existing = db.query(Subscription).filter(
            Subscription.follower_id == follower_id,
            Subscription.followed_id == followed_id
        ).first()
        
        if existing:
            return existing
        
        # Can't follow yourself
        if follower_id == followed_id:
            return None
        
        # Create new subscription
        db_subscription = Subscription(
            follower_id=follower_id,
            followed_id=followed_id
        )
        db.add(db_subscription)
        db.commit()
        db.refresh(db_subscription)
        return db_subscription

    @staticmethod
    def unfollow_user(db: Session, follower_id: int, followed_id: int):
        """Delete a subscription (unfollow a user)."""
        db_subscription = db.query(Subscription).filter(
            Subscription.follower_id == follower_id,
            Subscription.followed_id == followed_id
        ).first()
        
        if db_subscription:
            db.delete(db_subscription)
            db.commit()
            return True
        return False

    @staticmethod
    def get_followers(db: Session, user_id: int, skip: int = 0, limit: int = 100):
        """Get all followers of a user."""
        followers = db.query(Subscription).filter(
            Subscription.followed_id == user_id
        ).offset(skip).limit(limit).all()
        return followers

    @staticmethod
    def get_following(db: Session, user_id: int, skip: int = 0, limit: int = 100):
        """Get all users a user is following."""
        following = db.query(Subscription).filter(
            Subscription.follower_id == user_id
        ).offset(skip).limit(limit).all()
        return following

    @staticmethod
    def is_following(db: Session, follower_id: int, followed_id: int):
        """Check if a user is following another user."""
        existing = db.query(Subscription).filter(
            Subscription.follower_id == follower_id,
            Subscription.followed_id == followed_id
        ).first()
        return existing is not None

    @staticmethod
    def get_followers_count(db: Session, user_id: int):
        """Get the number of followers of a user."""
        return db.query(func.count(Subscription.id)).filter(
            Subscription.followed_id == user_id
        ).scalar()

    @staticmethod
    def get_following_count(db: Session, user_id: int):
        """Get the number of users a user is following."""
        return db.query(func.count(Subscription.id)).filter(
            Subscription.follower_id == user_id
        ).scalar() 