from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..config.database import get_db
from ..utils.security import get_current_active_user
from ..services import ParticipationService
from ..schemas import ParticipantDisplay
from ..models import User

router = APIRouter(
    prefix="/api/participations",
    tags=["participations"],
    responses={401: {"description": "Unauthorized"}},
)

@router.get("", response_model=List[ParticipantDisplay])
async def get_user_participations(
    skip: int = 0,
    limit: int = 10,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all events the current user is participating in."""
    return ParticipationService.get_user_participations(db, current_user.id, skip, limit) 