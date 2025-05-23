import os
import asyncio
import logging
import json
import requests
from datetime import datetime, timedelta
from aiogram import Bot, Dispatcher, Router, F
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.filters import Command
from aiogram.fsm.storage.memory import MemoryStorage
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from ..models import User, Event, EventParticipant, Invitation, Subscription
from ..config.database import SessionLocal
from ..repositories import EventRepository, ParticipationRepository
from ..services.telegram_deeplink_service import TelegramLinkService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize bot and dispatcher
load_dotenv()
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
BASE_URL = os.getenv("BASE_URL", "https://unl-events.duckdns.org")
VPS_API_URL = os.getenv("VPS_API_URL", "http://unl-events.duckdns.org:5000")
VPS_API_KEY = os.getenv("VPS_API_KEY", "your-secret-api-key")

# We'll keep these for local development, but primarily use the VPS forwarding
bot = None
dp = None
storage = MemoryStorage()
router = Router()

# Check if telegram bot token is available
if TELEGRAM_BOT_TOKEN:
    bot = Bot(token=TELEGRAM_BOT_TOKEN, parse_mode="HTML")
    dp = Dispatcher(storage=storage)
    
    # Печатаем только токен (маскированный)
    masked_token = f"{TELEGRAM_BOT_TOKEN[:5]}...{TELEGRAM_BOT_TOKEN[-5:]}"
    logger.info(f"Telegram bot initialized successfully with token: {masked_token}")
    # Полную информацию о боте получим позже при старте
else:
    logger.warning("TELEGRAM_BOT_TOKEN not set. Telegram functionality will be disabled.")

class TelegramController:
    @staticmethod
    async def _send_via_vps(chat_id, text, inline_keyboard=None, parse_mode=None):
        """
        Send a message through the VPS API
        """
        # Prepare payload for VPS API
        payload = {
            "chat_id": chat_id,
            "text": text,
        }
        
        if parse_mode:
            payload["parse_mode"] = parse_mode
            
        if inline_keyboard:
            payload["inline_keyboard"] = inline_keyboard
            
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {VPS_API_KEY}"
        }
        
        # Send request to VPS API
        try:
            logger.info(f"Sending message to chat_id {chat_id} via VPS API")
            response = requests.post(
                f"{VPS_API_URL}/send_message",
                json=payload,
                headers=headers,
                timeout=10 # 10 seconds timeout
            )
            
            # Check response
            if response.status_code == 200:
                result = response.json()
                logger.info(f"Message successfully sent via VPS API. Message ID: {result.get('message_id')}")
                return True
            else:
                logger.error(f"VPS API error: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            logger.error(f"Error sending message via VPS API: {e}")
            return False
            
    @staticmethod
    async def _try_send_message(recipient: User, message: str, keyboard=None, parse_mode=None):
        """
        Try to send a message to a user using available contact methods.
        Returns True if message was sent successfully, False otherwise.
        """
        # Try to send via VPS first, as this is likely to work better
        if recipient.telegram_chat_id:
            # Convert aiogram keyboard to format suitable for VPS API
            inline_keyboard = None
            if keyboard:
                inline_keyboard = []
                # Extract button data from InlineKeyboardMarkup
                if isinstance(keyboard, InlineKeyboardMarkup):
                    for row in keyboard.inline_keyboard:
                        button_row = []
                        for button in row:
                            button_data = {"text": button.text}
                            if button.url:
                                button_data["url"] = button.url
                            button_row.append(button_data)
                        inline_keyboard.append(button_row)
            
            if await TelegramController._send_via_vps(
                recipient.telegram_chat_id, 
                message, 
                inline_keyboard, 
                parse_mode
            ):
                return True
                
        # Fall back to direct Telegram API if VPS fails and bot is initialized
        if bot:
            # Try chat_id first if available
            if recipient.telegram_chat_id:
                try:
                    logger.info(f"Sending message to user {recipient.id} via chat_id {recipient.telegram_chat_id} (direct)")
                    await bot.send_message(
                        chat_id=recipient.telegram_chat_id,
                        text=message,
                        parse_mode=parse_mode,
                        reply_markup=keyboard
                    )
                    logger.info(f"Message sent to user {recipient.id} via chat_id (direct)")
                    return True
                except Exception as e:
                    logger.error(f"Error sending message via chat_id (direct): {e}")
        
        # If VPS API and direct methods both failed
        logger.warning(f"Could not contact user {recipient.id} via Telegram (all methods failed).")
        return False

    @staticmethod
    async def send_event_invitation(user_id: int, event_id: int, base_url: str):
        """Send event invitation to user."""
        # Check if bot is available
        if not bot:
            logger.warning("Telegram bot not initialized. Skipping invitation.")
            return False
            
        # Get DB session
        db = SessionLocal()
        try:
            # Get user
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                logger.error(f"User not found: {user_id}")
                return False
            
            # Get event
            event = db.query(Event).filter(Event.id == event_id).first()
            if not event:
                logger.error(f"Event not found: {event_id}")
                return False
            
            # Get event creator
            creator = db.query(User).filter(User.id == event.creator_id).first()
            
            # Format message
            event_date = event.event_date.strftime("%d.%m.%Y %H:%M")
            message = (
                f"🎉 <b>Новое приглашение на мероприятие!</b>\n\n"
                f"<b>{event.title}</b>\n"
                f"📅 {event_date}\n"
                f"📍 {event.location}\n"
                f"👤 Организатор: {creator.full_name}\n\n"
                f"Посетите сайт, чтобы узнать подробности и подтвердить участие."
            )
            
            # Create inline keyboard
            keyboard = InlineKeyboardMarkup(inline_keyboard=[[
                InlineKeyboardButton(
                    text="Открыть на сайте", 
                    url=f"{base_url}/events/{event_id}"
                )
            ]])
            
            # Send message if user has telegram_chat_id
            if await TelegramController._try_send_message(user, message, keyboard):
                return True
            
            logger.warning(f"No way to contact user {user_id} via Telegram")
            return False
            
        except Exception as e:
            logger.error(f"Error sending invitation: {e}")
            return False
        finally:
            db.close()

    @staticmethod
    async def send_event_reminder(event_id: int, base_url: str, hours_before: int = 24):
        """Send event reminder to participants."""
        # Check if bot is available
        if not bot:
            logger.warning("Telegram bot not initialized. Skipping reminder.")
            return False
            
        # Get DB session
        db = SessionLocal()
        try:
            # Get event
            event = db.query(Event).filter(Event.id == event_id).first()
            if not event:
                logger.error(f"Event not found: {event_id}")
                return False
            
            # Get participants
            participants = db.query(EventParticipant).filter(
                EventParticipant.event_id == event_id
            ).all()
            
            if not participants:
                logger.info(f"No participants for event: {event_id}")
                return True
            
            # Format message
            event_date = event.event_date.strftime("%d.%m.%Y %H:%M")
            message = (
                f"⏰ <b>Напоминание о мероприятии!</b>\n\n"
                f"<b>{event.title}</b>\n"
                f"📅 {event_date} (через {hours_before} ч.)\n"
                f"📍 {event.location}\n\n"
                f"Не забудьте посетить мероприятие!"
            )
            
            # Create inline keyboard
            keyboard = InlineKeyboardMarkup(inline_keyboard=[[
                InlineKeyboardButton(
                    text="Открыть на сайте", 
                    url=f"{base_url}/events/{event_id}"
                )
            ]])
            
            # Send messages to participants
            sent_count = 0
            for participant in participants:
                user = db.query(User).filter(User.id == participant.user_id).first()
                if not user:
                    continue
                
                # Try to send message
                if await TelegramController._try_send_message(user, message, keyboard, parse_mode="HTML"):
                    sent_count += 1
                
                # Small delay to avoid hitting rate limits
                await asyncio.sleep(0.1)
            
            logger.info(f"Sent reminders to {sent_count}/{len(participants)} participants for event {event_id}")
            return True
        except Exception as e:
            logger.error(f"Error sending reminders: {e}")
            return False
        finally:
            db.close()

    @staticmethod
    async def send_bulk_invitations(event_id: int, base_url: str):
        """Send invitations to all users invited to an event."""
        # Check if bot is available
        if not bot:
            logger.warning("Telegram bot not initialized. Skipping bulk invitations.")
            return False
            
        # Get DB session
        db = SessionLocal()
        try:
            # Get event
            event = db.query(Event).filter(Event.id == event_id).first()
            if not event:
                logger.error(f"Event not found: {event_id}")
                return False
            
            # Get invitations
            invitations = db.query(Invitation).filter(
                Invitation.event_id == event_id
            ).all()
            
            if not invitations:
                logger.info(f"No invitations for event: {event_id}")
                return True
            
            # Send invitations
            for invitation in invitations:
                await TelegramController.send_event_invitation(
                    invitation.user_id, 
                    event_id, 
                    base_url
                )
                # Small delay to avoid hitting rate limits
                await asyncio.sleep(0.3)
            
            return True
        except Exception as e:
            logger.error(f"Error sending bulk invitations: {e}")
            return False
        finally:
            db.close()

    @staticmethod
    async def send_upcoming_event_reminders(base_url: str, hours_before: int = 24):
        """Send reminders for all events happening in the next X hours."""
        # Check if bot is available
        if not bot:
            logger.warning("Telegram bot not initialized. Skipping upcoming event reminders.")
            return False
            
        # Get DB session
        db = SessionLocal()
        try:
            # Get events in the next X hours
            now = datetime.now()
            target_time = now + timedelta(hours=hours_before)
            
            # Events starting between now and target_time
            upcoming_events = db.query(Event).filter(
                Event.event_date > now,
                Event.event_date <= target_time
            ).all()
            
            if not upcoming_events:
                logger.info(f"No upcoming events in the next {hours_before} hours")
                return True
            
            # Send reminders for each event
            for event in upcoming_events:
                await TelegramController.send_event_reminder(
                    event.id, 
                    base_url, 
                    hours_before
                )
                # Small delay between events
                await asyncio.sleep(0.5)
            
            return True
        except Exception as e:
            logger.error(f"Error sending upcoming event reminders: {e}")
            return False
        finally:
            db.close()

    @staticmethod
    async def notify_followers_about_event(creator_id: int, event_id: int, base_url: str, is_update: bool = False):
        """Notify followers about a new or updated event created by the user they follow."""
        # Check if bot is available
        if not bot:
            logger.warning("Telegram bot not initialized. Skipping followers notification.")
            return False
            
        # Get DB session
        db = SessionLocal()
        try:
            # Get the event
            event = db.query(Event).filter(Event.id == event_id).first()
            if not event:
                logger.error(f"Event not found: {event_id}")
                return False
            
            # Get the creator
            creator = db.query(User).filter(User.id == creator_id).first()
            if not creator:
                logger.error(f"Creator not found: {creator_id}")
                return False
            
            # Get all followers (users who have subscribed to the creator)
            followers = db.query(User).join(
                Subscription, User.id == Subscription.follower_id
            ).filter(
                Subscription.followed_id == creator_id
            ).all()
            
            logger.info(f"Found {len(followers)} followers for user {creator_id} (event {event_id})")
            
            if not followers:
                logger.info(f"No followers found for user {creator_id}")
                return True
            
            # Format message
            event_date = event.event_date.strftime("%d.%m.%Y %H:%M")
            if is_update:
                message = (
                    f"🔄 <b>Обновление мероприятия от {creator.full_name}</b>\n\n"
                    f"<b>{event.title}</b>\n"
                    f"📅 {event_date}\n"
                    f"📍 {event.location}\n\n"
                    f"Пользователь, на которого вы подписаны, обновил информацию о мероприятии. "
                    f"Посетите сайт, чтобы узнать актуальные подробности."
                )
            else:
                message = (
                    f"🔔 <b>Новое мероприятие от {creator.full_name}</b>\n\n"
                    f"<b>{event.title}</b>\n"
                    f"📅 {event_date}\n"
                    f"📍 {event.location}\n\n"
                    f"Пользователь, на которого вы подписаны, создал новое мероприятие. "
                    f"Посетите сайт, чтобы узнать подробности и подтвердить участие."
                )
            
            # Create inline keyboard
            keyboard = InlineKeyboardMarkup(inline_keyboard=[[
                InlineKeyboardButton(
                    text="Открыть на сайте", 
                    url=f"{base_url}/events/{event_id}"
                )
            ]])
            
            # Send notification to each follower
            sent_count = 0
            for follower in followers:
                # Try to send message
                logger.info(f"Attempting to send notification to follower {follower.id} ({follower.full_name})")
                if await TelegramController._try_send_message(follower, message, keyboard, parse_mode="HTML"):
                    sent_count += 1
                
                # Small delay to avoid hitting rate limits
                await asyncio.sleep(0.1)
            
            action_type = "update" if is_update else "creation"
            logger.info(f"Sent {action_type} notifications to {sent_count}/{len(followers)} followers for user {creator_id}")
            return True
        except Exception as e:
            logger.error(f"Error notifying followers: {e}")
            return False
        finally:
            db.close()


# Register router handlers if bot is available
if bot and dp:
    @router.message(Command("start"))
    async def start_command(message: Message):
        args = message.text.split()
        chat_id = message.chat.id
        username = message.from_user.username

        if len(args) == 2 and args[1].startswith("link_"):
            token = args[1]
            db = SessionLocal()
            try:
                user = TelegramLinkService.get_user_by_token(db, token)
                if user:
                    user.telegram_chat_id = str(chat_id)
                    db.commit()

                    await message.answer("✅ Ваш Telegram успешно привязан к аккаунту!")
                else:
                    await message.answer("❌ Ссылка недействительна или устарела.")
            except Exception as e:
                logger.error(f"Failed to link Telegram: {e}")
                await message.answer("❌ Произошла ошибка. Попробуйте позже.")
            finally:
                db.close()
        else:
            await message.answer("👋 Привет! Я бот для уведомлений. Используйте команду /link для привязки.")


    @router.message(Command("help"))
    async def help_command(message: Message):
        await message.answer("/start — начало\n/events — список мероприятий\n/link — привязать аккаунт")

    @router.message(Command("link"))
    async def link_command(message: Message):
        await message.answer(
            f"Для привязки вашего Telegram-аккаунта к аккаунту на сайте, используйте следующую информацию:\n\n"
            f"Chat ID: <code>{message.chat.id}</code>\n"
            f"Username: @{message.from_user.username}\n\n"
            f"Передайте эти данные администратору для привязки аккаунта.",
            parse_mode="HTML"
        )

    @router.message(Command("events"))
    async def events_command(message: Message):
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.telegram_chat_id == str(message.chat.id)).first()
            if not user:
                await message.answer("Вы не привязаны к сайту. Привяжите аккаунт.")
                return

            now = datetime.now()
            participations = db.query(EventParticipant).filter(
                EventParticipant.user_id == user.id
            ).all()

            event_ids = [p.event_id for p in participations]
            upcoming = db.query(Event).filter(
                Event.id.in_(event_ids), Event.event_date > now
            ).order_by(Event.event_date).limit(5).all()

            if not upcoming:
                await message.answer("📅 Нет запланированных мероприятий.")
                return

            text = "📅 <b>Ближайшие мероприятия:</b>\n\n"
            for event in upcoming:
                event_date = event.event_date.strftime("%d.%m.%Y %H:%M")
                text += f"<b>{event.title}</b>\n📅 {event_date}\n📍 {event.location}\n\n"

            await message.answer(text)
        except Exception as e:
            logger.error(f"/events error: {e}")
            await message.answer("Произошла ошибка. Попробуйте позже.")
        finally:
            db.close()


async def start_bot():
    """Start the Telegram bot polling."""
    if not bot or not dp:
        logger.warning("Telegram bot not initialized. Skipping bot start.")
        return
        
    try:
        # Получаем информацию о боте
        try:
            bot_info = await bot.get_me()
            logger.info(f"Starting Telegram bot: @{bot_info.username} (ID: {bot_info.id})")
        except Exception as e:
            logger.warning(f"Could not get bot info: {e}")
            
        dp.include_router(router)
        await bot.delete_webhook(drop_pending_updates=True)
        await dp.start_polling(bot)
        logger.info("Telegram bot polling started successfully")
    except Exception as e:
        logger.error(f"Failed to start Telegram bot: {e}")

async def stop_bot():
    """Stop the Telegram bot."""
    if not bot:
        return
        
    try:
        await bot.session.close()
        if dp and dp.storage:
            await dp.storage.close()
            await dp.storage.wait_closed()
        logger.info("Telegram bot stopped successfully")
    except Exception as e:
        logger.error(f"Error stopping Telegram bot: {e}")