FROM python:3.11-slim

WORKDIR /app
COPY . .

# Установка клиента PostgreSQL и curl для healthcheck
RUN apt-get update && apt-get install -y postgresql-client curl && rm -rf /var/lib/apt/lists/*

ENV PYTHONPATH=/app

RUN pip install --no-cache-dir -r requirements.txt

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

CMD ["/entrypoint.sh"]
