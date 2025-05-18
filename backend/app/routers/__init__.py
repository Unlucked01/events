from fastapi import APIRouter

from .auth import router as auth_router
from .users import router as users_router
from .events import router as events_router
from .invitations import router as invitations_router
from .participations import router as participations_router

router = APIRouter()

router.include_router(auth_router)
router.include_router(users_router)
router.include_router(events_router)
router.include_router(invitations_router)
router.include_router(participations_router)

__all__ = ["router"] 