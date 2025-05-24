#!/bin/bash
set -e

echo "📦 Ждём запуска базы данных..."
until pg_isready -h db -p 5432 -U "$POSTGRES_USER"; do
  sleep 1
done

echo "✅ База данных готова, запускаем инициализацию..."
PYTHONPATH=/app python -m app.utils.init_db

echo "🚀 Запуск FastAPI..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --limit-max-request-size 20971520
