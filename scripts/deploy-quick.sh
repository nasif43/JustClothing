#!/bin/bash

###############################################################################
# Quick Deployment Script - For already deployed systems
# This updates code and restarts services
###############################################################################

set -e

# Configuration
APP_USER="${APP_USER:-justclothing}"
APP_HOME="/home/$APP_USER/justclothing"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

if [[ $EUID -ne 0 ]]; then
    log_error "This script must be run as root"
fi

log_info "Starting quick deployment update..."

# Pull latest code
cd $APP_HOME
log_info "Pulling latest code..."
sudo -u $APP_USER git pull || log_warning "Git pull failed - ensure git is configured"

# Update Python dependencies
log_info "Updating Python dependencies..."
sudo -u $APP_USER ./venv/bin/pip install -r backend/requirements.txt

# Update frontend
log_info "Updating frontend..."
cd $APP_HOME/frontend
sudo -u $APP_USER npm install
sudo -u $APP_USER npm run build

# Run migrations
log_info "Running database migrations..."
cd $APP_HOME
sudo -u $APP_USER ./venv/bin/python backend/manage.py migrate

# Collect static files
log_info "Collecting static files..."
sudo -u $APP_USER ./venv/bin/python backend/manage.py collectstatic --noinput

# Restart services
log_info "Restarting services..."
supervisorctl restart gunicorn celery celery-beat
systemctl restart nginx

log_success "Deployment update complete!"
log_info "Services restarted: gunicorn, celery, celery-beat, nginx"
