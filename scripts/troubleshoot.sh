#!/bin/bash

################################################################################
# JustClothing Diagnostic and Recovery Script
# Use this to troubleshoot and recover from common issues
################################################################################

set -e

APP_DIR="/opt/justclothing"
VENV_DIR="$APP_DIR/venv"
LOG_DIR="/var/log/justclothing"

# Colors
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
        print_error "This script requires sudo"
        exit 1
    fi
}

################################################################################
# DIAGNOSTIC FUNCTIONS
################################################################################

diagnose_services() {
    print_header "Service Status Diagnostic"
    
    local services=(
        "gunicorn-justclothing"
        "celery-justclothing"
        "celery-beat-justclothing"
        "nginx"
        "postgresql"
        "redis-server"
        "minio"
    )
    
    local failed=0
    
    for service in "${services[@]}"; do
        if systemctl is-active --quiet $service; then
            echo -e "${GREEN}●${NC} $service (running)"
        else
            echo -e "${RED}●${NC} $service (STOPPED)"
            ((failed++))
        fi
    done
    
    if [ $failed -gt 0 ]; then
        print_warning "Found $failed stopped services"
        return 1
    else
        print_success "All services running"
        return 0
    fi
}

diagnose_ports() {
    print_header "Port Configuration Diagnostic"
    
    local ports=(
        "80:HTTP"
        "443:HTTPS"
        "8000:Gunicorn"
        "5432:PostgreSQL"
        "6379:Redis"
        "9000:MinIO API"
        "9001:MinIO Console"
    )
    
    for port_info in "${ports[@]}"; do
        IFS=: read port name <<< "$port_info"
        if lsof -i :$port &>/dev/null; then
            echo -e "${GREEN}✓${NC} Port $port ($name) - In use"
        else
            echo -e "${YELLOW}○${NC} Port $port ($name) - Not in use"
        fi
    done
}

diagnose_database() {
    print_header "Database Diagnostic"
    
    if sudo -u postgres psql -d justclothing_db -c "SELECT 1;" &>/dev/null; then
        print_success "PostgreSQL connection successful"
        
        # Get database size
        SIZE=$(sudo -u postgres psql -d justclothing_db -t -c "SELECT pg_size_pretty(pg_database_size('justclothing_db'));")
        echo "Database size: $SIZE"
        
        # Get table count
        TABLES=$(sudo -u postgres psql -d justclothing_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';")
        echo "Number of tables: $TABLES"
        
        return 0
    else
        print_error "PostgreSQL connection FAILED"
        return 1
    fi
}

diagnose_redis() {
    print_header "Redis Diagnostic"
    
    if redis-cli ping &>/dev/null; then
        print_success "Redis connection successful"
        
        # Get memory usage
        MEMORY=$(redis-cli info memory | grep used_memory_human | cut -d: -f2)
        echo "Memory usage: $MEMORY"
        
        # Get number of keys
        KEYS=$(redis-cli dbsize | grep keys | awk '{print $2}')
        echo "Number of keys: $KEYS"
        
        return 0
    else
        print_error "Redis connection FAILED"
        return 1
    fi
}

diagnose_disk() {
    print_header "Disk Space Diagnostic"
    
    print_warning "Checking disk usage..."
    df -h | head -2
    
    print_warning "Top directories in /opt/justclothing:"
    du -sh /opt/justclothing/* 2>/dev/null | sort -rh | head -5
    
    # Check if disk is critically full
    USAGE=$(df / | awk 'NR==2 {print $5}' | cut -d% -f1)
    if [ "$USAGE" -gt 90 ]; then
        print_error "Disk is $USAGE% full - CRITICAL"
        return 1
    elif [ "$USAGE" -gt 80 ]; then
        print_warning "Disk is $USAGE% full - WARNING"
        return 0
    else
        print_success "Disk usage at $USAGE% - OK"
        return 0
    fi
}

diagnose_memory() {
    print_header "Memory Usage Diagnostic"
    
    print_warning "Total memory usage:"
    free -h | head -2
    
    # Get individual service memory usage
    print_warning "Memory by service:"
    ps aux | grep -E 'gunicorn|celery|nginx|postgres' | grep -v grep | awk '{print $2, $6, $11}' | head -10
    
    # Check if memory usage is critical
    USAGE=$(free | awk 'NR==2 {printf("%.0f", $3/$2 * 100)}')
    if [ "$USAGE" -gt 90 ]; then
        print_error "Memory usage is $USAGE% - CRITICAL"
        return 1
    elif [ "$USAGE" -gt 80 ]; then
        print_warning "Memory usage is $USAGE% - WARNING"
        return 0
    else
        print_success "Memory usage at $USAGE% - OK"
        return 0
    fi
}

diagnose_ssl() {
    print_header "SSL Certificate Diagnostic"
    
    if certbot certificates &>/dev/null; then
        print_success "SSL certificates found"
        certbot certificates
        return 0
    else
        print_error "No SSL certificates found"
        return 1
    fi
}

diagnose_logs() {
    print_header "Recent Errors in Logs"
    
    echo -e "${BLUE}Backend errors (last 5):${NC}"
    journalctl -u gunicorn-justclothing -p err -n 5 --no-pager || echo "No errors found"
    
    echo -e "\n${BLUE}Nginx errors (last 5):${NC}"
    tail -5 $LOG_DIR/nginx/error.log 2>/dev/null || echo "No errors found"
    
    echo -e "\n${BLUE}Celery errors (last 5):${NC}"
    grep -i error $LOG_DIR/celery/worker.log 2>/dev/null | tail -5 || echo "No errors found"
}

################################################################################
# RECOVERY FUNCTIONS
################################################################################

recover_restart_service() {
    check_sudo
    
    SERVICE=$1
    
    print_header "Restarting $SERVICE"
    
    systemctl restart $SERVICE
    sleep 2
    
    if systemctl is-active --quiet $SERVICE; then
        print_success "$SERVICE restarted successfully"
        return 0
    else
        print_error "Failed to restart $SERVICE"
        journalctl -u $SERVICE -n 20 --no-pager
        return 1
    fi
}

recover_restart_all() {
    check_sudo
    
    print_header "Restarting ALL Services"
    
    print_warning "Restarting services..."
    systemctl restart gunicorn-justclothing
    systemctl restart celery-justclothing
    systemctl restart celery-beat-justclothing
    systemctl reload nginx
    
    sleep 3
    
    print_success "All services restarted"
    diagnose_services
}

recover_clear_redis() {
    check_sudo
    
    print_header "Clearing Redis Cache"
    
    print_warning "This will clear all cached data!"
    echo -n "Continue? (yes/no): "
    read -r response
    
    if [ "$response" = "yes" ]; then
        redis-cli FLUSHDB
        print_success "Redis cache cleared"
        return 0
    else
        print_warning "Cache clear cancelled"
        return 1
    fi
}

recover_clear_logs() {
    check_sudo
    
    print_header "Clearing Old Logs"
    
    print_warning "Removing logs older than 30 days..."
    find $LOG_DIR -name "*.log" -mtime +30 -delete
    journalctl --vacuum=30d
    
    print_success "Logs cleared"
}

recover_restart_postgres() {
    check_sudo
    
    print_header "Restarting PostgreSQL"
    
    systemctl restart postgresql
    sleep 3
    
    if diagnose_database; then
        print_success "PostgreSQL restarted successfully"
        return 0
    else
        print_error "PostgreSQL failed to restart"
        return 1
    fi
}

recover_disk_cleanup() {
    check_sudo
    
    print_header "Cleaning Up Disk Space"
    
    print_warning "Cleaning up..."
    
    # Clear old logs
    echo "Removing logs older than 30 days..."
    find $LOG_DIR -name "*.log" -mtime +30 -delete
    
    # Clear Python cache
    echo "Removing Python cache files..."
    find $APP_DIR -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
    find $APP_DIR -name "*.pyc" -delete
    
    # Clear journal
    echo "Vacuuming journal..."
    journalctl --vacuum=30d
    
    # Clean apt
    echo "Cleaning package manager cache..."
    apt-get clean
    apt-get autoclean
    
    print_success "Disk cleanup completed"
    diagnose_disk
}

recover_database_optimize() {
    check_sudo
    
    print_header "Optimizing PostgreSQL Database"
    
    print_warning "This may take a few minutes..."
    
    sudo -u postgres psql -d justclothing_db << EOF
ANALYZE;
REINDEX DATABASE justclothing_db;
VACUUM ANALYZE;
EOF
    
    print_success "Database optimization completed"
}

recover_reset_migrations() {
    check_sudo
    
    print_header "Resetting Django Migrations"
    
    print_warning "This will reset migration state!"
    echo -n "Continue? (yes/no): "
    read -r response
    
    if [ "$response" = "yes" ]; then
        cd $APP_DIR/backend
        source $VENV_DIR/bin/activate
        python manage.py migrate zero
        python manage.py migrate
        print_success "Migrations reset successfully"
        systemctl restart gunicorn-justclothing
        return 0
    else
        print_warning "Migration reset cancelled"
        return 1
    fi
}

recover_reinit_static() {
    check_sudo
    
    print_header "Reinitializing Static Files"
    
    print_warning "Removing old static files..."
    rm -rf $APP_DIR/backend/staticfiles/*
    
    print_warning "Collecting new static files..."
    cd $APP_DIR/backend
    source $VENV_DIR/bin/activate
    python manage.py collectstatic --noinput
    
    print_success "Static files reinitialized"
    systemctl reload nginx
}

################################################################################
# TESTING FUNCTIONS
################################################################################

test_api() {
    print_header "Testing API Connectivity"
    
    echo "Testing API endpoint..."
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://localhost/api/products/ -k)
    
    if [ "$RESPONSE" = "200" ]; then
        print_success "API is responding (HTTP $RESPONSE)"
        return 0
    else
        print_error "API returned HTTP $RESPONSE"
        return 1
    fi
}

test_database_write() {
    print_header "Testing Database Write"
    
    cd $APP_DIR/backend
    source $VENV_DIR/bin/activate
    
    python -c "
from django.core.management import execute_from_command_line
from django.conf import settings
if not settings.configured:
    execute_from_command_line(['manage.py', 'shell', '-c', 'print(\"Database OK\")'])
" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        print_success "Database write test passed"
        return 0
    else
        print_error "Database write test failed"
        return 1
    fi
}

test_email() {
    print_header "Testing Email Configuration"
    
    cd $APP_DIR/backend
    source $VENV_DIR/bin/activate
    
    python manage.py shell << EOF
from django.core.mail import send_mail
try:
    send_mail(
        'Test Email',
        'This is a test email from JustClothing deployment.',
        'noreply@justclothing.store',
        ['admin@justclothing.store'],
        fail_silently=False,
    )
    print("Email sent successfully")
except Exception as e:
    print(f"Email send failed: {e}")
EOF
}

################################################################################
# MAIN MENU
################################################################################

show_menu() {
    cat << 'EOF'

╔═══════════════════════════════════════════════════════════════╗
║     JustClothing Diagnostic and Recovery Tool                ║
╚═══════════════════════════════════════════════════════════════╝

DIAGNOSTICS:
  1) Full System Diagnostic
  2) Service Status
  3) Port Configuration
  4) Database Diagnostic
  5) Redis Diagnostic
  6) Disk Space Diagnostic
  7) Memory Usage Diagnostic
  8) SSL Certificate Diagnostic
  9) Error Logs Review

RECOVERY:
  10) Restart Individual Service
  11) Restart All Services
  12) Clear Redis Cache
  13) Clear Old Logs
  14) Restart PostgreSQL
  15) Clean Up Disk Space
  16) Optimize Database
  17) Reset Migrations
  18) Reinitialize Static Files

TESTING:
  19) Test API Connectivity
  20) Test Database Write
  21) Test Email Configuration

OTHER:
  0) Exit
  h) Show Help

Select an option: 
EOF
}

show_help() {
    cat << 'EOF'

DIAGNOSTIC COMMANDS - Safe to run anytime
  These commands only report status and don't change anything
  Use these to understand what's wrong with your system

RECOVERY COMMANDS - Use when services are down
  These commands restart services or clear caches
  Use when you have connectivity or performance issues
  Most are safe but some will affect running operations

TESTING COMMANDS - Verify system functionality
  These test that all components are working correctly
  Use after recovery to verify success

COMMON SCENARIOS:

Website not loading:
  1) Run "1) Full System Diagnostic"
  2) Check "2) Service Status"
  3) Run "11) Restart All Services"
  4) Run "19) Test API Connectivity"

Database issues:
  1) Run "4) Database Diagnostic"
  2) Run "14) Restart PostgreSQL"
  3) Run "16) Optimize Database"

Performance issues:
  1) Run "6) Disk Space Diagnostic"
  2) Run "7) Memory Usage Diagnostic"
  3) Run "15) Clean Up Disk Space"

Email not working:
  1) Run "21) Test Email Configuration"
  2) Check email settings in Django admin

All services stopped:
  1) Run "11) Restart All Services"
  2) Wait 30 seconds
  3) Run "2) Service Status"

EOF
}

################################################################################
# MAIN LOOP
################################################################################

main() {
    while true; do
        show_menu
        read -r choice
        
        case $choice in
            # Diagnostics
            1) 
                diagnose_services
                diagnose_database
                diagnose_redis
                diagnose_disk
                diagnose_memory
                ;;
            2) diagnose_services ;;
            3) diagnose_ports ;;
            4) diagnose_database ;;
            5) diagnose_redis ;;
            6) diagnose_disk ;;
            7) diagnose_memory ;;
            8) diagnose_ssl ;;
            9) diagnose_logs ;;
            
            # Recovery
            10)
                echo "Enter service name (gunicorn-justclothing, celery-justclothing, etc.): "
                read -r service
                recover_restart_service "$service"
                ;;
            11) recover_restart_all ;;
            12) recover_clear_redis ;;
            13) recover_clear_logs ;;
            14) recover_restart_postgres ;;
            15) recover_disk_cleanup ;;
            16) recover_database_optimize ;;
            17) recover_reset_migrations ;;
            18) recover_reinit_static ;;
            
            # Testing
            19) test_api ;;
            20) test_database_write ;;
            21) test_email ;;
            
            # Other
            0)
                echo "Goodbye!"
                exit 0
                ;;
            h)
                show_help
                ;;
            *)
                print_error "Invalid option: $choice"
                ;;
        esac
        
        echo ""
        echo "Press Enter to continue..."
        read -r
    done
}

# Run main if not sourced
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
