#!/bin/bash

# JustClothing Database Reset Script
# This script will completely reset the database and regenerate test data

set -e  # Exit immediately if a command exits with a non-zero status

echo "🛑 JustClothing Database Reset Script"
echo "======================================"

# Step 1: Stop all services
echo "🛑 Stopping all Docker services..."
docker-compose down

# Step 2: Remove database volume
echo "🗑️  Removing database volume..."
docker volume ls | grep postgres | awk '{print $2}' | xargs docker volume rm || echo "No postgres volume found"

# Step 3: Remove migration files
echo "📁 Removing migration files..."
find backend/apps/*/migrations/ -name "*.py" ! -name "__init__.py" -delete 2>/dev/null || true

# Step 4: Start database services
echo "🚀 Starting database services..."
docker-compose up -d db redis

# Step 5: Wait for database
echo "⏳ Waiting for database..."
sleep 15

# Step 6: Create migrations
echo "📄 Creating migrations..."
docker-compose run --rm backend python manage.py makemigrations

# Step 7: Apply migrations
echo "🔄 Applying migrations..."
docker-compose run --rm backend python manage.py migrate

# Step 8: Create superuser
echo "👑 Creating superuser..."
docker-compose run --rm backend python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@justclothing.com', 'admin123')
    print('Superuser created')
"

# Step 9: Populate test data
echo "🎭 Populating test data..."
docker-compose run --rm backend python manage.py populate_test_data

# Step 10: Start all services
echo "🚀 Starting all services..."
docker-compose up -d

echo ""
echo "✅ Reset completed!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:8000"
echo "👨‍💼 Admin: http://localhost:8000/admin (admin/admin123)"
echo "🔑 Test accounts: testpass123" 