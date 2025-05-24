from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import os
from app.services.telegram_deeplink_service import TelegramLinkService
from app.config.database import get_db
from app.models import User
from app.utils.security import get_current_active_user
from app.controllers.telegram_controller import bot

router = APIRouter(prefix="/api/telegram", tags=["telegram"])

@router.post("/link-token")
def create_telegram_link_token(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    token = TelegramLinkService.create_link_token(db, current_user.id)
    bot_username = os.getenv("BOT_USERNAME")
    if not bot_username:
        # Try to get from aiogram bot instance if available
        if bot:
            import asyncio
            try:
                loop = asyncio.get_event_loop()
                bot_info = loop.run_until_complete(bot.get_me())
                bot_username = bot_info.username
            except Exception:
                bot_username = None
        # As a last resort, hardcode the username (replace with your bot's username)
        if not bot_username:
            bot_username = "psu_vkr_events_bot"
    link = f"https://t.me/{bot_username}?start={token}"
    return {"deep_link": link} 