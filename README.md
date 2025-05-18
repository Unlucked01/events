# Система организации мероприятий и встреч в сообществе

Автоматизированная система для создания, управления и распространения информации о мероприятиях с возможностью уведомлений, подписок и взаимодействия пользователей.

## Технологический стек

* **Frontend**: Next.js + Material UI (MUI)
* **Backend**: FastAPI (Python) с архитектурой MVC
* **База данных**: PostgreSQL
* **Интеграция**: Telegram Bot API, APScheduler (для CRON задач)

## Основные функции

- ✅ Регистрация и авторизация
- ✅ Управление профилем пользователя
- ✅ Система подписок на других пользователей
- ✅ Создание и редактирование мероприятий
- ✅ Лента мероприятий
- ✅ Приглашения и участие в мероприятиях
- ✅ Комментарии и отзывы
- ✅ Telegram-бот для уведомлений

## Структура проекта

```
.
├── backend/                  # FastAPI бэкенд
│   ├── app/                  # Основной код приложения
│   │   ├── config/           # Конфигурации
│   │   ├── controllers/      # Контроллеры
│   │   ├── models/           # Модели данных (БД)
│   │   ├── repositories/     # Репозитории для доступа к данным
│   │   ├── routers/          # API роуты
│   │   ├── schemas/          # Pydantic схемы
│   │   ├── services/         # Бизнес-логика
│   │   ├── static/           # Статические файлы
│   │   └── utils/            # Утилиты
│   ├── migrations/           # Миграции Alembic
│   ├── tests/                # Тесты
│   ├── .env.example          # Пример файла с переменными окружения
│   ├── Dockerfile            # Dockerfile для бэкенда
│   └── requirements.txt      # Зависимости Python
├── frontend/                 # Next.js фронтенд
├── docker-compose.yml        # Docker Compose файл
└── README.md                 # Документация
```

## Запуск проекта

### Предварительные требования

- Docker и Docker Compose
- Telegram Bot Token (для функций уведомлений)

### Настройка переменных окружения

1. Скопируйте файл `.env.example` в `.env`:
   ```
   cp backend/.env.example backend/.env
   ```

2. Отредактируйте `.env` файл, добавив необходимые значения:
   ```
   DATABASE_URL=postgresql://postgres:postgres@db/events_db
   SECRET_KEY=your_super_secret_key_here
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
   BASE_URL=http://localhost:3000
   ```

### Запуск с Docker Compose

```bash
docker-compose up -d
```

После запуска:
- Backend API будет доступен по адресу: http://localhost:8000
- Frontend будет доступен по адресу: http://localhost:3000
- Swagger документация: http://localhost:8000/docs

### Локальный запуск (для разработки)

#### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # На Windows: .venv\Scripts\activate
pip install -r requirements.txt
python server.py
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Миграции базы данных

Для создания новой миграции:

```bash
cd backend
alembic revision --autogenerate -m "Description of changes"
```

Для применения миграций:

```bash
alembic upgrade head
```

## API Documentation

API документация доступна через Swagger UI по адресу:
http://localhost:8000/docs

## Разработка

### Добавление новых функций

1. Определите модели в `backend/app/models/`
2. Обновите схемы в `backend/app/schemas/`
3. Добавьте бизнес-логику в `backend/app/services/`
4. Создайте новые API маршруты в `backend/app/routers/`
5. Добавьте компоненты UI во фронтенд

### Запуск тестов

```bash
cd backend
pytest
```

## Автор

Данная система разработана как дипломный проект. 