import os
import time
import random
from datetime import datetime, timedelta
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from app.config.database import engine, Base, SessionLocal
from app.models import User, Event, EventImage, EventParticipant, Subscription
from passlib.context import CryptContext

load_dotenv()

def create_tables():
    Base.metadata.create_all(bind=engine)
    print("✅ Таблицы созданы")
    # Даём время завершиться транзакциям создания таблиц
    time.sleep(1)

def create_admin():
    db: Session = SessionLocal()
    try:
        existing = db.query(User).filter(User.username == "admin").first()
        if existing:
            print("ℹ️  Пользователь admin уже существует")
            return

        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        hashed_password = pwd_context.hash(os.getenv("ADMIN_PASSWORD", "admin123"))

        admin = User(
            username="admin",
            password=hashed_password,
            full_name="Администратор",
            phone="0000000000",
            is_active=True,
        )
        db.add(admin)
        db.commit()
        print("✅ Пользователь admin создан")
    finally:
        db.close()

def create_demo_data():
    """Создает демонстрационные данные для тестирования."""
    db: Session = SessionLocal()
    try:
        # Проверяем, есть ли уже какие-то данные
        users_count = db.query(User).count()
        if users_count > 1:  # Admin уже создан
            print("ℹ️  Демо-данные уже существуют")
            return
        
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        demo_password = pwd_context.hash("demopassword")
        
        # Создаем тестовых пользователей
        demo_users = [
            User(
                username="user1",
                password=demo_password,
                full_name="Иван Петров",
                phone="9001234567",
                is_active=True
            ),
            User(
                username="user2",
                password=demo_password,
                full_name="Мария Иванова",
                phone="9009876543",
                is_active=True
            ),
            User(
                username="user3",
                password=demo_password,
                full_name="Алексей Смирнов",
                phone="9005554433",
                is_active=True
            ),
            User(
                username="user4",
                password=demo_password,
                full_name="Елена Сидорова",
                phone="9001112233",
                is_active=True
            ),
            User(
                username="user5",
                password=demo_password,
                full_name="Дмитрий Козлов",
                phone="9004445566",
                is_active=True
            ),
        ]
        
        db.add_all(demo_users)
        db.commit()
        
        # Получаем всех пользователей (включая admin)
        all_users = db.query(User).all()
        
        # Создаем подписки между пользователями
        subscriptions = []
        for follower in all_users:
            # Каждый пользователь подписывается на 2-3 других случайных пользователя
            for _ in range(random.randint(2, 3)):
                followed = random.choice(all_users)
                if followed.id != follower.id and not any(s.follower_id == follower.id and s.followed_id == followed.id for s in subscriptions):
                    subscriptions.append(
                        Subscription(
                            follower_id=follower.id,
                            followed_id=followed.id
                        )
                    )
        
        db.add_all(subscriptions)
        db.commit()
        
        # Создаем события
        event_descriptions = [
            "Приглашаем на увлекательную встречу, где мы обсудим последние тренды в веб-разработке. "
            "Будут интересные доклады от опытных специалистов и возможность пообщаться с коллегами.",
            
            "Мастер-класс по разработке мобильных приложений. Погрузимся в особенности создания "
            "кроссплатформенных решений. Практические примеры и живое обсуждение гарантированы!",
            
            "Вечеринка для технических специалистов! Неформальное общение, нетворкинг "
            "и возможность обсудить интересные проекты в непринужденной обстановке.",
            
            "Семинар по искусственному интеллекту и машинному обучению. Обсудим последние достижения "
            "и перспективы развития технологий. Подходит как для новичков, так и для опытных специалистов.",
            
            "Хакатон для разработчиков: 24 часа на создание прототипа проекта! Приходите с идеями "
            "или присоединяйтесь к существующим командам. Призы победителям гарантированы."
        ]
        
        event_titles = [
            "Конференция по веб-разработке",
            "Мастер-класс: Мобильная разработка",
            "ИТ-вечеринка",
            "Семинар по AI и ML",
            "Хакатон #DevChallenge"
        ]
        
        event_locations = [
            "Технопарк 'Сколково'",
            "Коворкинг 'Рабочая станция'",
            "Конференц-зал 'Горизонт'",
            "ИТ-кластер 'Технополис'",
            "Бизнес-центр 'Метрополис'"
        ]
        
        # Создаем события на ближайшие 30 дней
        events = []
        now = datetime.now()
        
        for i in range(5):
            creator = random.choice(all_users)
            event_date = now + timedelta(days=random.randint(1, 30))
            
            event = Event(
                title=event_titles[i],
                description=event_descriptions[i],
                location=event_locations[i],
                event_date=event_date,
                creator_id=creator.id
            )
            events.append(event)
        
        db.add_all(events)
        db.commit()
        
        # Добавляем участников к событиям
        for event in events:
            # Создатель автоматически становится участником
            db.add(EventParticipant(event_id=event.id, user_id=event.creator_id))
            
            # Добавляем случайных участников
            for _ in range(random.randint(3, 6)):
                user = random.choice(all_users)
                # Проверяем, что пользователь еще не участвует
                if not db.query(EventParticipant).filter_by(event_id=event.id, user_id=user.id).first():
                    db.add(EventParticipant(event_id=event.id, user_id=user.id))
        
        db.commit()
        
        # Добавляем изображения к событиям
        event_images = [
            "https://images.unsplash.com/photo-1540317580384-e5d43867caa6",
            "https://images.unsplash.com/photo-1558403194-611308249627",
            "https://images.unsplash.com/photo-1591115765373-5207764f72e4",
            "https://images.unsplash.com/photo-1515187029135-18ee286d815b",
            "https://images.unsplash.com/photo-1544531585-9847b68c8c86"
        ]
        
        for i, event in enumerate(events):
            db.add(EventImage(
                event_id=event.id,
                image_path=event_images[i % len(event_images)]
            ))
            
            # Для некоторых событий добавляем второе изображение
            if random.random() > 0.5:
                db.add(EventImage(
                    event_id=event.id,
                    image_path=event_images[(i + 2) % len(event_images)]
                ))
        
        db.commit()
        print("✅ Демонстрационные данные созданы")
    except Exception as e:
        print(f"❌ Ошибка при создании демо-данных: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    create_tables()
    create_admin()
    create_demo_data()
