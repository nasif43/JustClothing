#!/bin/bash

# JustClothing Management Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to build and start development environment
dev_start() {
    print_status "Starting development environment..."
    check_docker
    docker-compose up --build
}

# Function to start development environment in background
dev_start_bg() {
    print_status "Starting development environment in background..."
    check_docker
    docker-compose up --build -d
}

# Function to stop development environment
dev_stop() {
    print_status "Stopping development environment..."
    docker-compose down
}

# Function to start production environment
prod_start() {
    print_status "Starting production environment..."
    check_docker
    
    if [ ! -f ".env.prod" ]; then
        print_error "Production environment file .env.prod not found!"
        print_warning "Please create .env.prod with production settings."
        exit 1
    fi
    
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
}

# Function to stop production environment
prod_stop() {
    print_status "Stopping production environment..."
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
}

# Function to view logs
logs() {
    service=${1:-""}
    if [ -z "$service" ]; then
        docker-compose logs -f
    else
        docker-compose logs -f "$service"
    fi
}

# Function to run Django management commands
django_manage() {
    if [ $# -eq 0 ]; then
        print_error "Please provide a Django management command"
        exit 1
    fi
    
    docker-compose exec backend python manage.py "$@"
}

# Function to create Django superuser
create_superuser() {
    print_status "Creating Django superuser..."
    docker-compose exec backend python manage.py createsuperuser
}

# Function to run migrations
migrate() {
    print_status "Running database migrations..."
    docker-compose exec backend python manage.py makemigrations
    docker-compose exec backend python manage.py migrate
}

# Function to collect static files
collectstatic() {
    print_status "Collecting static files..."
    docker-compose exec backend python manage.py collectstatic --noinput
}

# Function to backup database
backup_db() {
    timestamp=$(date +%Y%m%d_%H%M%S)
    backup_file="backup_${timestamp}.sql"
    
    print_status "Creating database backup: $backup_file"
    docker-compose exec db pg_dump -U justclothing_user justclothing_db > "$backup_file"
    print_status "Database backup created: $backup_file"
}

# Function to restore database
restore_db() {
    if [ $# -eq 0 ]; then
        print_error "Please provide backup file path"
        exit 1
    fi
    
    backup_file="$1"
    if [ ! -f "$backup_file" ]; then
        print_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    print_warning "This will overwrite the current database. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Restoring database from: $backup_file"
        docker-compose exec -T db psql -U justclothing_user justclothing_db < "$backup_file"
        print_status "Database restored successfully"
    else
        print_status "Database restore cancelled"
    fi
}

# Function to clean up Docker resources
cleanup() {
    print_status "Cleaning up Docker resources..."
    docker-compose down -v
    docker system prune -f
    print_status "Cleanup completed"
}

# Function to show help
show_help() {
    echo "JustClothing Management Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  dev-start       Start development environment"
    echo "  dev-start-bg    Start development environment in background"
    echo "  dev-stop        Stop development environment"
    echo "  prod-start      Start production environment"
    echo "  prod-stop       Stop production environment"
    echo "  logs [service]  View logs (optionally for specific service)"
    echo "  manage [cmd]    Run Django management command"
    echo "  superuser       Create Django superuser"
    echo "  migrate         Run database migrations"
    echo "  collectstatic   Collect static files"
    echo "  backup-db       Backup database"
    echo "  restore-db      Restore database from backup"
    echo "  cleanup         Clean up Docker resources"
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 dev-start"
    echo "  $0 logs backend"
    echo "  $0 manage shell"
    echo "  $0 backup-db"
}

# Main script logic
case "$1" in
    "dev-start")
        dev_start
        ;;
    "dev-start-bg")
        dev_start_bg
        ;;
    "dev-stop")
        dev_stop
        ;;
    "prod-start")
        prod_start
        ;;
    "prod-stop")
        prod_stop
        ;;
    "logs")
        logs "$2"
        ;;
    "manage")
        shift
        django_manage "$@"
        ;;
    "superuser")
        create_superuser
        ;;
    "migrate")
        migrate
        ;;
    "collectstatic")
        collectstatic
        ;;
    "backup-db")
        backup_db
        ;;
    "restore-db")
        restore_db "$2"
        ;;
    "cleanup")
        cleanup
        ;;
    "help"|"--help"|"-h"|"")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac 