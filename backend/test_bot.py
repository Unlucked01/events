#!/usr/bin/env python3
"""
Скрипт для тестирования работы Telegram бота.
Используется для диагностики проблем с подключением и отправкой сообщений.
"""

import asyncio
import os
import logging
from aiogram import Bot
from dotenv import load_dotenv

# Настройка логирования
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Загрузка переменных окружения
load_dotenv()
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

async def test_bot_connection():
    """Тестирование подключения к Telegram API и получение информации о боте."""
    if not TELEGRAM_BOT_TOKEN:
        logger.error("TELEGRAM_BOT_TOKEN не найден в .env файле")
        return False
    
    try:
        logger.info(f"Инициализация бота с токеном: {TELEGRAM_BOT_TOKEN[:5]}...{TELEGRAM_BOT_TOKEN[-5:]}")
        bot = Bot(token=TELEGRAM_BOT_TOKEN)
        
        # Получение информации о боте
        bot_info = await bot.get_me()
        logger.info(f"Успешное подключение к боту @{bot_info.username} (ID: {bot_info.id})")
        logger.info(f"Имя бота: {bot_info.first_name}")
        
        # Очистка ресурсов
        await bot.session.close()
        return True
    except Exception as e:
        logger.error(f"Ошибка при подключении к Telegram API: {e}")
        return False

async def send_test_message(chat_id):
    """Отправка тестового сообщения пользователю по chat_id."""
    if not TELEGRAM_BOT_TOKEN:
        logger.error("TELEGRAM_BOT_TOKEN не найден в .env файле")
        return False
    
    try:
        logger.info(f"Отправка тестового сообщения пользователю с chat_id: {chat_id}")
        bot = Bot(token=TELEGRAM_BOT_TOKEN)
        
        # Отправка тестового сообщения
        message = await bot.send_message(
            chat_id=chat_id,
            text="🔍 Тестовое сообщение от бота\n\nЕсли вы видите это сообщение, значит бот работает корректно!"
        )
        
        logger.info(f"Сообщение успешно отправлено! Message ID: {message.message_id}")
        
        # Очистка ресурсов
        await bot.session.close()
        return True
    except Exception as e:
        logger.error(f"Ошибка при отправке сообщения: {e}")
        return False

async def main():
    """Основная функция для тестирования бота."""
    logger.info("Начало тестирования Telegram бота")
    
    # Тестирование подключения к боту
    connected = await test_bot_connection()
    if not connected:
        logger.error("Не удалось подключиться к боту. Проверьте токен.")
        return
    
    # Запрос chat_id для тестирования отправки сообщения
    chat_id = input("\nВведите chat_id для тестирования отправки сообщения (опционально): ")
    if chat_id:
        await send_test_message(chat_id)
    
    logger.info("Тестирование завершено")

if __name__ == "__main__":
    asyncio.run(main()) 