from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..config.database import get_db
from ..utils.security import get_current_active_user
from ..services import InvitationService
from ..schemas import InvitationDisplay
from ..models import User

router = APIRouter(
    prefix="/api/invitations",
    tags=["invitations"],
    responses={401: {"description": "Unauthorized"}},
)

@router.get("", response_model=List[InvitationDisplay])
async def get_user_invitations(
    skip: int = 0,
    limit: int = 10,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all invitations for the current user."""
    return InvitationService.get_user_invitations(db, current_user, skip, limit) 