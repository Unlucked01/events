#!/bin/bash
set -e

echo "📦 Ждём запуска базы данных..."

# Увеличиваем таймаут и добавляем более детальную проверку
MAX_ATTEMPTS=60
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if pg_isready -h db -p 5432 -U postgres -d events_db -q; then
        echo "✅ База данных готова"
        break
    fi
    ATTEMPT=$((ATTEMPT + 1))
    echo "⏳ Попытка $ATTEMPT/$MAX_ATTEMPTS..."
    sleep 2
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo "❌ Не удалось подключиться к базе данных за $(($MAX_ATTEMPTS * 2)) секунд"
    exit 1
fi

# Дополнительная пауза для стабилизации соединения
sleep 3

echo "🔧 Запускаем инициализацию базы данных..."
PYTHONPATH=/app python -m app.utils.init_db

echo "🚀 Запуск FastAPI..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload