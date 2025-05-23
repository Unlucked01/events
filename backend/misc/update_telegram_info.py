#!/usr/bin/env python3
"""
Скрипт для обновления Telegram информации пользователя.
Использование: python update_telegram_info.py <user_id> <telegram_chat_id> [telegram_username]
"""

import sys
import os
from app.config.database import SessionLocal
from app.models import User

def update_user_telegram_info(user_id, telegram_chat_id):
    """Обновить информацию Telegram для пользователя"""
    db = SessionLocal()
    try:
        # Найти пользователя
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            print(f"Ошибка: пользователь с ID {user_id} не найден")
            return False
        
        # Обновить информацию
        user.telegram_chat_id = telegram_chat_id
        
        db.commit()
        print(f"Успешно обновлена информация Telegram для пользователя {user.full_name} (ID: {user.id})")
        print(f"  - telegram_chat_id: {user.telegram_chat_id}")
        return True
    
    except Exception as e:
        print(f"Ошибка при обновлении информации: {e}")
        return False
    finally:
        db.close()

def main():
    if len(sys.argv) < 3:
        print("Использование: python update_telegram_info.py <user_id> <telegram_chat_id>")
        sys.exit(1)
    
    user_id = int(sys.argv[1])
    telegram_chat_id = sys.argv[2]
    
    update_user_telegram_info(user_id, telegram_chat_id)

if __name__ == "__main__":
    main() 