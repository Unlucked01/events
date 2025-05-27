# Локальная разработка с Docker

Этот проект можно легко запустить локально с помощью Docker Compose.

## Требования

- Docker
- Docker Compose

## Быстрый старт

1. **Клонируйте репозиторий:**
   ```bash
   git clone <repository-url>
   cd events
   ```

2. **Запустите локальное окружение:**
   ```bash
   ./start-local.sh
   ```

   Или вручную:
   ```bash
   docker-compose -f docker-compose.local.yml up --build
   ```

3. **Откройте приложение:**
   - 📱 Frontend: http://localhost:3000
   - 🔧 Backend API: http://localhost:8000
   - 📚 API Documentation: http://localhost:8000/docs
   - 🗄️ Database: localhost:5432

## Структура проекта

```
events/
├── backend/                 # FastAPI backend
│   ├── Dockerfile.dev      # Development Dockerfile
│   ├── entrypoint.dev.sh   # Development entrypoint
│   └── ...
├── frontend_v2/            # Next.js frontend
│   ├── Dockerfile.dev      # Development Dockerfile
│   └── ...
├── docker-compose.local.yml # Local development compose
└── start-local.sh          # Quick start script
```

## Особенности локального окружения

### Backend
- **Hot reload**: Изменения в коде автоматически перезагружают сервер
- **База данных**: PostgreSQL 13 с автоматическими миграциями
- **Telegram бот**: Отключен для локальной разработки
- **API URL**: http://localhost:8000/api

### Frontend
- **Hot reload**: Изменения в коде автоматически обновляют страницу
- **API подключение**: Настроено на локальный backend
- **URL**: http://localhost:3000

### База данных
- **PostgreSQL 13**
- **Порт**: 5432
- **Пользователь**: postgres
- **Пароль**: postgres
- **База данных**: events_db

## Полезные команды

### Остановка контейнеров
```bash
docker-compose -f docker-compose.local.yml down
```

### Пересборка контейнеров
```bash
docker-compose -f docker-compose.local.yml up --build
```

### Просмотр логов
```bash
# Все сервисы
docker-compose -f docker-compose.local.yml logs -f

# Конкретный сервис
docker-compose -f docker-compose.local.yml logs -f backend
docker-compose -f docker-compose.local.yml logs -f frontend
docker-compose -f docker-compose.local.yml logs -f db
```

### Подключение к базе данных
```bash
docker exec -it events-db-local psql -U postgres -d events_db
```

### Выполнение команд в контейнерах
```bash
# Backend
docker exec -it events-backend-local bash

# Frontend
docker exec -it events-frontend-local sh
```

## Отладка

### Проблемы с портами
Если порты 3000, 8000 или 5432 заняты, измените их в `docker-compose.local.yml`:

```yaml
services:
  backend:
    ports:
      - "8001:8000"  # Изменить на свободный порт
  frontend:
    ports:
      - "3001:3000"  # Изменить на свободный порт
  db:
    ports:
      - "5433:5432"  # Изменить на свободный порт
```

### Очистка данных
Для полной очистки данных и контейнеров:

```bash
docker-compose -f docker-compose.local.yml down -v
docker system prune -f
```

### Проблемы с API
Если фронтенд не может подключиться к API, проверьте:

1. Что backend контейнер запущен: `docker ps`
2. Логи backend: `docker-compose -f docker-compose.local.yml logs backend`
3. Доступность API: `curl http://localhost:8000/health`

## Разработка

### Изменения в коде
- **Backend**: Изменения применяются автоматически благодаря volume mount и uvicorn --reload
- **Frontend**: Изменения применяются автоматически благодаря Next.js dev server

### Добавление зависимостей

**Backend (Python):**
1. Добавьте пакет в `backend/requirements.txt`
2. Пересоберите контейнер: `docker-compose -f docker-compose.local.yml up --build backend`

**Frontend (Node.js):**
1. Добавьте пакет в `frontend_v2/package.json`
2. Пересоберите контейнер: `docker-compose -f docker-compose.local.yml up --build frontend`

## Переход на продакшн

Для деплоя на сервер используйте основной `docker-compose.yml` файл с соответствующими настройками окружения. 