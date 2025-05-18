from sqlalchemy.orm import Session
from sqlalchemy import func
from ..models import User, Event, Subscription
from ..schemas import UserCreate, UserUpdate
from ..utils.security import get_password_hash

class UserRepository:
    @staticmethod
    def create(db: Session, user_data: UserCreate):
        """Create a new user."""
        # Hash the password
        hashed_password = get_password_hash(user_data.password)
        db_user = User(
            username=user_data.username,
            password=hashed_password,
            full_name=user_data.full_name,
            phone=user_data.phone
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def get_by_id(db: Session, user_id: int):
        """Get user by ID."""
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_by_username(db: Session, username: str):
        """Get user by username."""
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def get_by_phone(db: Session, phone: str):
        """Get user by phone."""
        return db.query(User).filter(User.phone == phone).first()

    @staticmethod
    def update(db: Session, user_id: int, user_data: UserUpdate):
        """Update user."""
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            return None
        
        # Update fields if provided
        update_data = user_data.dict(exclude_unset=True)
        
        # Hash password if it's being updated
        if "password" in update_data and update_data["password"]:
            update_data["password"] = get_password_hash(update_data["password"])
        
        for key, value in update_data.items():
            setattr(db_user, key, value)
        
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100):
        """Get all users."""
        return db.query(User).offset(skip).limit(limit).all()

    @staticmethod
    def search(db: Session, query: str, skip: int = 0, limit: int = 100):
        """Search users by username or phone."""
        search_query = f"%{query}%"
        return db.query(User).filter(
            (User.username.ilike(search_query)) | 
            (User.phone.ilike(search_query)) |
            (User.full_name.ilike(search_query))
        ).offset(skip).limit(limit).all()

    @staticmethod
    def get_user_stats(db: Session, user_id: int):
        """Get user statistics: event count, follower count, following count."""
        events_count = db.query(func.count(Event.id)).filter(Event.creator_id == user_id).scalar()
        followers_count = db.query(func.count(Subscription.id)).filter(Subscription.followed_id == user_id).scalar()
        following_count = db.query(func.count(Subscription.id)).filter(Subscription.follower_id == user_id).scalar()
        
        return {
            "events_count": events_count,
            "followers_count": followers_count,
            "following_count": following_count
        }

    @staticmethod
    def delete(db: Session, user_id: int):
        """Delete user."""
        db_user = db.query(User).filter(User.id == user_id).first()
        if db_user:
            db.delete(db_user)
            db.commit()
            return True
        return False 