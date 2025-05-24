from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..config.database import get_db
from ..services import AuthService
from ..schemas import UserCreate, UserDisplay, Token

router = APIRouter(
    prefix="/api/auth",
    tags=["auth"],
    responses={401: {"description": "Unauthorized"}},
)

@router.post("/register", response_model=UserDisplay, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    return AuthService.register(db, user_data)

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login and get access token."""
    # Convert form data to UserLogin model
    from ..schemas import UserLogin
    user_login = UserLogin(
        username=form_data.username,
        password=form_data.password
    )
    
    # Login user
    return AuthService.login(db, user_login) 