#!/bin/bash

echo "🚀 Starting local development environment..."

# Stopping and removing existing containers
echo "🧹 Cleaning up existing containers..."
docker-compose -f docker-compose.local.yml down -v

# Building and starting containers
echo "🔨 Building and starting containers..."
docker-compose -f docker-compose.local.yml up --build

echo "✅ Local environment started!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "🗄️ Database: localhost:5432"
echo ""
echo "Press Ctrl+C to stop"