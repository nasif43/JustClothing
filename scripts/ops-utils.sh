#!/bin/bash

###############################################################################
# Operations Utilities - Common management tasks
###############################################################################

set -e

APP_USER="${APP_USER:-justclothing}"
APP_HOME="/home/$APP_USER/justclothing"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        echo -e "${RED}[ERROR]${NC} This command requires root privileges"
        exit 1
    fi
}

# Display menu
show_menu() {
    echo ""
    echo "================================"
    echo "JustClothing Operations Utility"
    echo "================================"
    echo "1. View application status"
    echo "2. View gunicorn logs (live)"
    echo "3. View celery logs (live)"
    echo "4. View nginx logs (live)"
    echo "5. Restart gunicorn"
    echo "6. Restart celery workers"
    echo "7. Restart nginx"
    echo "8. Restart all services"
    echo "9. Create Django superuser"
    echo "10. Run Django shell"
    echo "11. Database backup"
    echo "12. Database restore"
    echo "13. Clear cache (Redis)"
    echo "14. Check disk usage"
    echo "15. Exit"
    echo "================================"
    read -p "Select option: " choice
}

# Status
status() {
    check_root
    log_info "Application Status:"
    supervisorctl status
    echo ""
    log_info "PostgreSQL:"
    systemctl status postgresql --no-pager | grep -E "active|failed"
    echo ""
    log_info "Redis:"
    systemctl status redis-server --no-pager | grep -E "active|failed"
    echo ""
    log_info "Nginx:"
    systemctl status nginx --no-pager | grep -E "active|failed"
}

# Logs
logs_gunicorn() {
    check_root
    log_info "Gunicorn logs (press Ctrl+C to exit):"
    tail -f /var/log/gunicorn.log
}

logs_celery() {
    check_root
    log_info "Celery logs (press Ctrl+C to exit):"
    tail -f /var/log/celery-worker.log
}

logs_nginx() {
    log_info "Nginx access logs (press Ctrl+C to exit):"
    tail -f /var/log/nginx/access.log
}

# Restart services
restart_gunicorn() {
    check_root
    log_info "Restarting gunicorn..."
    supervisorctl restart gunicorn
    log_success "Gunicorn restarted"
}

restart_celery() {
    check_root
    log_info "Restarting celery workers..."
    supervisorctl restart celery celery-beat
    log_success "Celery restarted"
}

restart_nginx() {
    check_root
    log_info "Restarting nginx..."
    systemctl restart nginx
    log_success "Nginx restarted"
}

restart_all() {
    check_root
    log_info "Restarting all services..."
    supervisorctl restart all
    systemctl restart nginx
    systemctl restart postgresql
    systemctl restart redis-server
    log_success "All services restarted"
}

# Django commands
create_superuser() {
    log_info "Creating superuser..."
    cd $APP_HOME
    sudo -u $APP_USER ./venv/bin/python backend/manage.py createsuperuser
}

django_shell() {
    log_info "Starting Django shell..."
    cd $APP_HOME
    sudo -u $APP_USER ./venv/bin/python backend/manage.py shell
}

# Database backup
db_backup() {
    check_root
    BACKUP_DIR="/backups/justclothing"
    mkdir -p $BACKUP_DIR
    BACKUP_FILE="$BACKUP_DIR/db_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    log_info "Backing up database to $BACKUP_FILE..."
    sudo -u postgres pg_dump justclothing_db > $BACKUP_FILE
    gzip $BACKUP_FILE
    
    log_success "Database backed up to ${BACKUP_FILE}.gz"
}

# Database restore
db_restore() {
    check_root
    read -p "Enter backup file path: " backup_file
    
    if [ ! -f "$backup_file" ]; then
        echo "File not found: $backup_file"
        return 1
    fi
    
    log_info "Restoring database from $backup_file..."
    
    # Handle .gz files
    if [[ $backup_file == *.gz ]]; then
        gunzip -c "$backup_file" | sudo -u postgres psql justclothing_db
    else
        sudo -u postgres psql justclothing_db < "$backup_file"
    fi
    
    log_success "Database restored"
}

# Clear cache
clear_cache() {
    check_root
    log_info "Clearing Redis cache..."
    redis-cli FLUSHALL
    log_success "Cache cleared"
}

# Disk usage
disk_usage() {
    echo ""
    log_info "Disk Usage:"
    df -h
    echo ""
    log_info "Application Directory Size:"
    du -sh $APP_HOME
    echo ""
    log_info "Log Directory Size:"
    du -sh /var/log
}

# Main loop
main() {
    while true; do
        show_menu
        case $choice in
            1) status ;;
            2) logs_gunicorn ;;
            3) logs_celery ;;
            4) logs_nginx ;;
            5) restart_gunicorn ;;
            6) restart_celery ;;
            7) restart_nginx ;;
            8) restart_all ;;
            9) create_superuser ;;
            10) django_shell ;;
            11) db_backup ;;
            12) db_restore ;;
            13) clear_cache ;;
            14) disk_usage ;;
            15) echo "Exiting..."; exit 0 ;;
            *) echo "Invalid option"; continue ;;
        esac
    done
}

# If no arguments, show menu; otherwise execute command
if [ $# -eq 0 ]; then
    main
else
    case $1 in
        status) status ;;
        logs-gunicorn) logs_gunicorn ;;
        logs-celery) logs_celery ;;
        logs-nginx) logs_nginx ;;
        restart-gunicorn) restart_gunicorn ;;
        restart-celery) restart_celery ;;
        restart-nginx) restart_nginx ;;
        restart-all) restart_all ;;
        superuser) create_superuser ;;
        shell) django_shell ;;
        backup) db_backup ;;
        restore) db_restore ;;
        clear-cache) clear_cache ;;
        disk-usage) disk_usage ;;
        *) echo "Unknown command: $1"; exit 1 ;;
    esac
fi
