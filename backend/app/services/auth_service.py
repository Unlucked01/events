from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime, timedelta

from ..utils.security import verify_password, create_access_token
from ..repositories import UserRepository
from ..schemas import UserCreate, UserLogin, Token

class AuthService:
    @staticmethod
    def register(db: Session, user_data: UserCreate):
        """Register a new user."""
        # Check if username exists
        db_user = UserRepository.get_by_username(db, user_data.username)
        if db_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Имя пользователя уже занято"
            )
        
        # Check if phone exists
        db_user = UserRepository.get_by_phone(db, user_data.phone)
        if db_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Телефон уже зарегистрирован"
            )
        
        # Create user
        return UserRepository.create(db, user_data)

    @staticmethod
    def login(db: Session, user_data: UserLogin):
        """Login a user."""
        # Get user by username
        user = UserRepository.get_by_username(db, user_data.username)
        
        # Check if user exists and password is correct
        if not user or not verify_password(user_data.password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Неверное имя пользователя или пароль",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check if user is active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Пользователь неактивен"
            )
        
        # Create access token
        access_token = create_access_token(data={"sub": user.username})
        
        return Token(
            access_token=access_token,
            token_type="bearer"
        ) 