#!/bin/bash

# Wait for database to be ready
echo "Waiting for database..."
while ! pg_isready -h db -p 5432 -U postgres; do
  sleep 1
done
echo "Database is ready!"

# Run database migrations
echo "Running database migrations..."
alembic upgrade head

echo "🔧 Запускаем инициализацию базы данных..."
PYTHONPATH=/app python -m app.utils.init_db

# Start the application with hot reload
echo "Starting FastAPI development server with hot reload..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload