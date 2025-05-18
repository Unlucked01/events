#!/usr/bin/env python3
"""
Скрипт для тестирования сетевого соединения с Telegram API.
"""

import os
import asyncio
import logging
import urllib.request
import socket
from urllib.error import URLError, HTTPError
from dotenv import load_dotenv

# Настройка логирования
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Загружаем переменные окружения
load_dotenv()
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TIMEOUT = 10  # Таймаут в секундах

def test_dns_resolution():
    """Проверка DNS разрешения для api.telegram.org"""
    try:
        ip_address = socket.gethostbyname('api.telegram.org')
        logger.info(f"DNS разрешение успешно. IP адрес api.telegram.org: {ip_address}")
        return True
    except socket.gaierror as e:
        logger.error(f"Ошибка DNS разрешения: {e}")
        return False

def test_http_connection():
    """Проверка HTTP соединения с api.telegram.org"""
    socket.setdefaulttimeout(TIMEOUT)
    try:
        response = urllib.request.urlopen('https://api.telegram.org')
        logger.info(f"HTTP соединение успешно. Статус: {response.status}")
        return True
    except HTTPError as e:
        logger.error(f"HTTP ошибка: {e.code} {e.reason}")
        return False
    except URLError as e:
        logger.error(f"URL ошибка: {e.reason}")
        return False
    except Exception as e:
        logger.error(f"Неожиданная ошибка: {e}")
        return False

def test_bot_token():
    """Проверка валидности токена бота"""
    if not BOT_TOKEN:
        logger.error("TELEGRAM_BOT_TOKEN не найден")
        return False
        
    socket.setdefaulttimeout(TIMEOUT)
    try:
        # Формируем URL для проверки токена (getMe API call)
        url = f'https://api.telegram.org/bot{BOT_TOKEN}/getMe'
        response = urllib.request.urlopen(url)
        
        # Проверяем ответ
        response_data = response.read().decode('utf-8')
        logger.info(f"Токен валидный. Ответ: {response_data}")
        return True
    except HTTPError as e:
        logger.error(f"Ошибка токена: {e.code} {e.reason}")
        response_data = e.read().decode('utf-8') if hasattr(e, 'read') else "No response data"
        logger.error(f"Ответ сервера: {response_data}")
        return False
    except URLError as e:
        logger.error(f"Ошибка соединения при проверке токена: {e.reason}")
        return False
    except Exception as e:
        logger.error(f"Неожиданная ошибка при проверке токена: {e}")
        return False

def main():
    """Основная функция тестирования"""
    logger.info("Начало диагностики сетевого соединения с Telegram API")
    
    # Шаг 1: Проверка DNS разрешения
    if not test_dns_resolution():
        logger.error("DNS разрешение не работает. Проверьте подключение к интернету или настройки DNS.")
        return
        
    # Шаг 2: Проверка HTTP соединения
    if not test_http_connection():
        logger.error("HTTP соединение с api.telegram.org не работает. Возможно блокировка на уровне сети.")
        return
        
    # Шаг 3: Проверка токена бота
    if not test_bot_token():
        logger.error("Токен бота недействителен. Проверьте токен в .env файле.")
        return
        
    logger.info("Все тесты пройдены успешно! Сетевое соединение с Telegram API работает.")

if __name__ == "__main__":
    main() 