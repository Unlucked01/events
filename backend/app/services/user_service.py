from sqlalchemy.orm import Session
from fastapi import HTTPException, status, UploadFile

from ..repositories import UserRepository
from ..schemas import UserUpdate, UserDetail
from ..utils.upload import save_image, delete_file
from ..models import User

class UserService:
    @staticmethod
    def get_user_by_id(db: Session, user_id: int):
        """Get user by ID with detail."""
        user = UserRepository.get_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Пользователь не найден"
            )
        
        # Get user stats
        stats = UserRepository.get_user_stats(db, user_id)
        
        # Create UserDetail object
        user_detail = UserDetail.from_orm(user)
        user_detail.events_count = stats["events_count"]
        user_detail.followers_count = stats["followers_count"]
        user_detail.following_count = stats["following_count"]
        
        return user_detail

    @staticmethod
    async def update_user(db: Session, user_id: int, user_data: UserUpdate, current_user: User):
        """Update user profile."""
        # Check if user is authorized to update
        if user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Нет прав на изменение профиля другого пользователя"
            )
        
        # Check if username exists if changing
        if user_data.username and user_data.username != current_user.username:
            user = UserRepository.get_by_username(db, user_data.username)
            if user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Имя пользователя уже занято"
                )
        
        # Check if phone exists if changing
        if user_data.phone and user_data.phone != current_user.phone:
            user = UserRepository.get_by_phone(db, user_data.phone)
            if user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Телефон уже зарегистрирован"
                )
        
        # Update user
        updated_user = UserRepository.update(db, user_id, user_data)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Пользователь не найден"
            )
        
        return updated_user

    @staticmethod
    async def update_profile_picture(db: Session, user_id: int, profile_picture: UploadFile, current_user: User):
        """Update user profile picture."""
        # Check if user is authorized to update
        if user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Нет прав на изменение профиля другого пользователя"
            )
        
        # Delete old profile picture if exists
        if current_user.profile_picture:
            await delete_file(current_user.profile_picture)
        
        # Save new profile picture
        image_path = await save_image(profile_picture, folder="profiles")
        
        # Update user profile picture path
        user_data = UserUpdate(profile_picture=image_path)
        updated_user = UserRepository.update(db, user_id, user_data)
        
        return updated_user

    @staticmethod
    def search_users(db: Session, query: str, skip: int = 0, limit: int = 10):
        """Search users by username, phone, or full name."""
        if not query or len(query) < 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Поисковый запрос должен содержать не менее 3 символов"
            )
        
        return UserRepository.search(db, query, skip, limit) 