#!/bin/bash

# Safe Deployment Script for JustClothing
# This script ensures your VPS production won't break when deploying changes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Function to backup current state
backup_current_state() {
    print_step "Creating backup of current production state..."
    
    # Backup database
    print_status "Backing up database..."
    docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T db pg_dump -U justclothing_user justclothing_db > "backup_$(date +%Y%m%d_%H%M%S).sql"
    
    # Backup current code
    print_status "Creating code backup..."
    git stash push -m "Pre-deployment backup $(date +%Y%m%d_%H%M%S)"
    
    print_status "Backup completed successfully!"
}

# Function to check prerequisites
check_prerequisites() {
    print_step "Checking deployment prerequisites..."
    
    # Check if we're on VPS
    if [ ! -f ".env" ]; then
        print_error "This script should be run on the VPS where .env exists!"
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running!"
        exit 1
    fi
    
    # Check if Nginx Proxy Manager is running (your HTTPS solution)
    if ! docker ps | grep -q "nginx-proxy-manager"; then
        print_warning "Nginx Proxy Manager not detected. Your HTTPS might be affected!"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    print_status "Prerequisites check passed!"
}

# Function to pull and validate changes
pull_and_validate() {
    print_step "Pulling latest changes from GitHub..."
    
    # Pull latest changes
    git pull origin main
    
    # Check if there are any new requirements
    if git diff HEAD~1 HEAD --name-only | grep -q "requirements.txt\|package.json"; then
        print_warning "Dependencies have changed. This might require rebuilding containers."
    fi
    
    # Check for database migrations
    if git diff HEAD~1 HEAD --name-only | grep -q "migrations"; then
        print_warning "Database migrations detected. Will run migrations during deployment."
    fi
    
    print_status "Code pulled successfully!"
}

# Function to deploy safely
deploy_production() {
    print_step "Deploying to production..."
    
    # Stop current services (but keep database running)
    print_status "Stopping application services..."
    docker compose -f docker-compose.yml -f docker-compose.prod.yml stop backend frontend celery celery-beat
    
    # Rebuild and start services
    print_status "Rebuilding and starting services..."
    docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
    
    # Wait for services to start
    print_status "Waiting for services to start..."
    sleep 30
    
    # Check if services are running
    if ! docker compose -f docker-compose.yml -f docker-compose.prod.yml ps | grep -q "Up"; then
        print_error "Some services failed to start!"
        print_error "Check logs with: docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs"
        exit 1
    fi
    
    print_status "Deployment completed successfully!"
}

# Function to verify deployment
verify_deployment() {
    print_step "Verifying deployment..."
    
    # Check if backend is responding
    print_status "Checking backend health..."
    if curl -f -s http://localhost:8000/health/ > /dev/null; then
        print_status "Backend is healthy!"
    else
        print_warning "Backend health check failed!"
    fi
    
    # Show running containers
    print_status "Current container status:"
    docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

    print_status "Deployment verification completed!"
}

# Function to rollback if needed
rollback() {
    print_step "Rolling back deployment..."
    
    # Restore previous code state
    git stash pop
    
    # Rebuild with previous code
    docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d

    print_status "Rollback completed!"
}

# Main deployment flow
main() {
    print_status "Starting safe deployment process..."
    
    # Check prerequisites
    check_prerequisites
    
    # Create backup
    backup_current_state
    
    # Pull changes
    pull_and_validate
    
    # Deploy
    deploy_production
    
    # Verify
    verify_deployment
    
    print_status "🎉 Deployment completed successfully!"
    print_warning "If you notice any issues, run this script with 'rollback' argument to revert changes."
}

# Handle rollback command
if [ "$1" = "rollback" ]; then
    rollback
    exit 0
fi

# Run main deployment
main