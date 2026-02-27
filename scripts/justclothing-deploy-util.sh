#!/bin/bash

################################################################################
# JustClothing Deployment Management Utility
# Provides easy commands for common deployment management tasks
################################################################################

set -e

APP_DIR="/opt/justclothing"
VENV_DIR="$APP_DIR/venv"
LOG_DIR="/var/log/justclothing"
APP_USER="justclothing"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if running with sudo
check_sudo() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This command requires sudo"
        exit 1
    fi
}

################################################################################
# Service Management
################################################################################

cmd_status() {
    print_header "Service Status"
    
    local services=(
        "gunicorn-justclothing"
        "celery-justclothing"
        "celery-beat-justclothing"
        "nginx"
        "postgresql"
        "redis-server"
        "minio"
    )
    
    for service in "${services[@]}"; do
        if systemctl is-active --quiet $service; then
            echo -e "${GREEN}●${NC} $service (running)"
        else
            echo -e "${RED}●${NC} $service (stopped)"
        fi
    done
}

cmd_start() {
    check_sudo
    print_header "Starting Services"
    
    systemctl start gunicorn-justclothing
    systemctl start celery-justclothing
    systemctl start celery-beat-justclothing
    systemctl start nginx
    
    print_success "Services started"
}

cmd_stop() {
    check_sudo
    print_header "Stopping Services"
    
    systemctl stop gunicorn-justclothing
    systemctl stop celery-justclothing
    systemctl stop celery-beat-justclothing
    systemctl stop nginx
    
    print_success "Services stopped"
}

cmd_restart() {
    check_sudo
    print_header "Restarting Services"
    
    systemctl restart gunicorn-justclothing
    systemctl restart celery-justclothing
    systemctl restart celery-beat-justclothing
    systemctl reload nginx
    
    print_success "Services restarted"
}

################################################################################
# Logging
################################################################################

cmd_logs_backend() {
    print_header "Backend Logs"
    journalctl -u gunicorn-justclothing -f --lines=50
}

cmd_logs_celery() {
    print_header "Celery Worker Logs"
    tail -f $LOG_DIR/celery/worker.log
}

cmd_logs_nginx() {
    print_header "Nginx Error Logs"
    tail -f $LOG_DIR/nginx/error.log
}

cmd_logs_access() {
    print_header "Nginx Access Logs"
    tail -f $LOG_DIR/nginx/access.log
}

cmd_logs_all() {
    print_header "All Service Logs"
    journalctl -u gunicorn-justclothing -u celery-justclothing -u nginx -f
}

################################################################################
# Diagnostics
################################################################################

cmd_health() {
    print_header "System Health Check"
    
    # CPU and Memory
    echo -e "${BLUE}Memory Usage:${NC}"
    free -h | head -2
    
    echo -e "\n${BLUE}Disk Usage:${NC}"
    df -h | grep -E '^/dev|Filesystem'
    
    # Service health
    echo -e "\n${BLUE}Service Health:${NC}"
    cmd_status
    
    # Database check
    echo -e "\n${BLUE}Database Connection:${NC}"
    if sudo -u postgres psql -d justclothing_db -c "SELECT 1;" &>/dev/null; then
        print_success "PostgreSQL connected"
    else
        print_error "PostgreSQL connection failed"
    fi
    
    # Redis check
    echo -e "\n${BLUE}Redis Check:${NC}"
    if redis-cli ping &>/dev/null; then
        print_success "Redis connected"
    else
        print_error "Redis connection failed"
    fi
}

cmd_performance() {
    print_header "Performance Metrics"
    
    echo -e "${BLUE}CPU & Memory:${NC}"
    top -b -n 1 | head -10
    
    echo -e "\n${BLUE}Gunicorn Workers:${NC}"
    ps aux | grep gunicorn | grep -v grep
    
    echo -e "\n${BLUE}Celery Workers:${NC}"
    ps aux | grep celery | grep -v grep
    
    echo -e "\n${BLUE}Network Connections:${NC}"
    netstat -tuln | grep -E '^Proto|8000|80|443|6379|5432'
}

cmd_errors() {
    print_header "Recent Errors"
    
    echo -e "${BLUE}Backend Errors:${NC}"
    journalctl -u gunicorn-justclothing -p err -n 10
    
    echo -e "\n${BLUE}Nginx Errors:${NC}"
    tail -10 $LOG_DIR/nginx/error.log
    
    echo -e "\n${BLUE}Celery Errors:${NC}"
    grep -i error $LOG_DIR/celery/worker.log | tail -10
}

################################################################################
# Database Management
################################################################################

cmd_db_shell() {
    check_sudo
    print_header "PostgreSQL Shell"
    sudo -u postgres psql -d justclothing_db
}

cmd_db_backup() {
    check_sudo
    print_header "Creating Database Backup"
    
    BACKUP_DIR="$APP_DIR/backups"
    mkdir -p "$BACKUP_DIR"
    DATE=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"
    
    sudo -u postgres pg_dump -Fc justclothing_db > "$BACKUP_FILE"
    print_success "Backup created: $BACKUP_FILE"
    ls -lh "$BACKUP_FILE"
}

cmd_db_restore() {
    check_sudo
    
    if [ -z "$2" ]; then
        print_error "Usage: $0 db-restore <backup-file>"
        exit 1
    fi
    
    if [ ! -f "$2" ]; then
        print_error "Backup file not found: $2"
        exit 1
    fi
    
    print_warning "This will restore the database and overwrite existing data!"
    echo -n "Continue? (yes/no): "
    read -r response
    
    if [ "$response" != "yes" ]; then
        print_warning "Restore cancelled"
        exit 0
    fi
    
    print_header "Restoring Database from Backup"
    sudo -u postgres pg_restore -d justclothing_db "$2"
    print_success "Database restored"
}

cmd_db_size() {
    print_header "Database Size"
    sudo -u postgres psql -d justclothing_db -c "SELECT 
        pg_database.datname,
        pg_size_pretty(pg_database_size(pg_database.datname)) AS size
    FROM pg_database
    WHERE datname = 'justclothing_db';"
}

cmd_db_stats() {
    print_header "Database Statistics"
    sudo -u postgres psql -d justclothing_db -c "
        SELECT 
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
        FROM pg_tables
        WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
}

################################################################################
# Django Management
################################################################################

cmd_shell() {
    check_sudo
    print_header "Django Interactive Shell"
    cd $APP_DIR/backend
    source $VENV_DIR/bin/activate
    python manage.py shell
}

cmd_createsuperuser() {
    check_sudo
    print_header "Create Django Superuser"
    cd $APP_DIR/backend
    source $VENV_DIR/bin/activate
    python manage.py createsuperuser
}

cmd_migrate() {
    check_sudo
    print_header "Running Database Migrations"
    cd $APP_DIR/backend
    source $VENV_DIR/bin/activate
    python manage.py migrate
    systemctl restart gunicorn-justclothing
    print_success "Migrations completed and backend restarted"
}

cmd_collectstatic() {
    check_sudo
    print_header "Collecting Static Files"
    cd $APP_DIR/backend
    source $VENV_DIR/bin/activate
    python manage.py collectstatic --noinput
    print_success "Static files collected"
}

################################################################################
# Updates and Deployments
################################################################################

cmd_update() {
    check_sudo
    print_header "Updating Application"
    
    echo "Updating backend code..."
    cd $APP_DIR/backend
    sudo -u $APP_USER git pull origin main || print_warning "Git pull failed"
    
    echo "Installing dependencies..."
    source $VENV_DIR/bin/activate
    pip install -r requirements.txt
    
    echo "Running migrations..."
    python manage.py migrate
    
    echo "Collecting static files..."
    python manage.py collectstatic --noinput
    
    echo "Updating frontend..."
    cd $APP_DIR/frontend
    sudo -u $APP_USER git pull origin main || print_warning "Git pull failed"
    sudo -u $APP_USER npm install
    sudo -u $APP_USER npm run build
    
    echo "Restarting services..."
    systemctl restart gunicorn-justclothing
    systemctl reload nginx
    
    print_success "Application updated successfully"
}

cmd_deploy() {
    check_sudo
    print_header "Deploying Changes"
    
    echo "Backing up database..."
    cmd_db_backup
    
    echo "Restarting backend..."
    systemctl restart gunicorn-justclothing
    
    echo "Restarting Celery..."
    systemctl restart celery-justclothing
    
    echo "Reloading Nginx..."
    systemctl reload nginx
    
    print_success "Deployment complete"
}

################################################################################
# SSL/Certificate Management
################################################################################

cmd_ssl_status() {
    print_header "SSL Certificate Status"
    certbot certificates
}

cmd_ssl_renew() {
    check_sudo
    print_header "Renewing SSL Certificate"
    certbot renew --verbose
    systemctl reload nginx
    print_success "SSL certificate renewed and nginx reloaded"
}

cmd_ssl_test() {
    print_header "SSL Configuration Test"
    echo "Testing SSL configuration at https://localhost..."
    curl -kI https://localhost 2>/dev/null | head -10
}

################################################################################
# Maintenance
################################################################################

cmd_clean_logs() {
    check_sudo
    print_header "Cleaning Old Logs"
    
    print_warning "Removing logs older than 30 days..."
    find $LOG_DIR -name "*.log" -mtime +30 -delete
    
    # Rotate journal
    journalctl --vacuum=30d
    
    print_success "Logs cleaned"
}

cmd_disk_usage() {
    print_header "Disk Usage Analysis"
    
    echo -e "${BLUE}Top directories by size:${NC}"
    du -sh $APP_DIR/* 2>/dev/null | sort -rh | head -10
    
    echo -e "\n${BLUE}Log directory sizes:${NC}"
    du -sh $LOG_DIR/* 2>/dev/null
    
    echo -e "\n${BLUE}Database size:${NC}"
    cmd_db_size
}

cmd_env_info() {
    print_header "Environment Information"
    
    echo -e "${BLUE}Python:${NC}"
    source $VENV_DIR/bin/activate
    python --version
    
    echo -e "\n${BLUE}Node.js:${NC}"
    node --version
    npm --version
    
    echo -e "\n${BLUE}PostgreSQL:${NC}"
    psql --version
    
    echo -e "\n${BLUE}Nginx:${NC}"
    nginx -v 2>&1
    
    echo -e "\n${BLUE}Redis:${NC}"
    redis-server --version
}

################################################################################
# Help and Usage
################################################################################

show_help() {
    cat << 'EOF'
JustClothing Deployment Management - Usage Guide

SERVICE MANAGEMENT:
  status              Show status of all services
  start               Start all services
  stop                Stop all services
  restart             Restart all services

LOGGING:
  logs-backend        Show backend application logs
  logs-celery         Show Celery worker logs
  logs-nginx          Show Nginx error logs
  logs-access         Show Nginx access logs
  logs-all            Show all service logs

DIAGNOSTICS:
  health              System health check
  performance         Performance metrics
  errors              Show recent errors

DATABASE:
  db-shell            Access PostgreSQL shell
  db-backup           Create database backup
  db-restore <file>   Restore from backup file
  db-size             Show database size
  db-stats            Show table statistics

DJANGO:
  shell               Django interactive shell
  createsuperuser     Create Django admin user
  migrate             Run pending migrations
  collectstatic       Collect static files

UPDATES:
  update              Pull latest code and update
  deploy              Deploy changes

SSL/HTTPS:
  ssl-status          Show SSL certificate status
  ssl-renew           Renew SSL certificate
  ssl-test            Test SSL configuration

MAINTENANCE:
  clean-logs          Remove logs older than 30 days
  disk-usage          Show disk usage analysis
  env-info            Show environment information

HELP:
  help                Show this help message
  version             Show script version

EXAMPLES:
  sudo ./justclothing-deploy-util.sh status
  sudo ./justclothing-deploy-util.sh logs-backend
  sudo ./justclothing-deploy-util.sh health
  sudo ./justclothing-deploy-util.sh db-backup
  sudo ./justclothing-deploy-util.sh update

EOF
}

show_version() {
    echo "JustClothing Deployment Utility v1.0"
    echo "Deployment Date: 2026-02-27"
}

################################################################################
# Main Entry Point
################################################################################

main() {
    local command="${1:-help}"
    
    case "$command" in
        # Service management
        status)             cmd_status ;;
        start)              cmd_start ;;
        stop)               cmd_stop ;;
        restart)            cmd_restart ;;
        
        # Logging
        logs-backend)       cmd_logs_backend ;;
        logs-celery)        cmd_logs_celery ;;
        logs-nginx)         cmd_logs_nginx ;;
        logs-access)        cmd_logs_access ;;
        logs-all)           cmd_logs_all ;;
        
        # Diagnostics
        health)             cmd_health ;;
        performance)        cmd_performance ;;
        errors)             cmd_errors ;;
        
        # Database
        db-shell)           cmd_db_shell ;;
        db-backup)          cmd_db_backup ;;
        db-restore)         cmd_db_restore "$@" ;;
        db-size)            cmd_db_size ;;
        db-stats)           cmd_db_stats ;;
        
        # Django
        shell)              cmd_shell ;;
        createsuperuser)    cmd_createsuperuser ;;
        migrate)            cmd_migrate ;;
        collectstatic)      cmd_collectstatic ;;
        
        # Updates
        update)             cmd_update ;;
        deploy)             cmd_deploy ;;
        
        # SSL
        ssl-status)         cmd_ssl_status ;;
        ssl-renew)          cmd_ssl_renew ;;
        ssl-test)           cmd_ssl_test ;;
        
        # Maintenance
        clean-logs)         cmd_clean_logs ;;
        disk-usage)         cmd_disk_usage ;;
        env-info)           cmd_env_info ;;
        
        # Help
        help)               show_help ;;
        version)            show_version ;;
        
        *)
            print_error "Unknown command: $command"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
