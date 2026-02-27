#!/bin/bash

################################################################################
# JustClothing VPS Deployment Script
# Deploys Django backend, React frontend, PostgreSQL, Redis, MinIO, and Nginx
# Assumes: Ubuntu/Debian-based system with sudo privileges
# Usage: sudo bash deploy-vps.sh or ./deploy-vps.sh
################################################################################

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration Variables
REPO_PATH="${1:-.}"
APP_USER="justclothing"
APP_GROUP="justclothing"
DOMAIN="${2:-justclothing.store}"
EMAIL="${3:-admin@justclothing.store}"
BACKEND_PORT=8000
MINIO_PORT=9000
MINIO_CONSOLE_PORT=9001
REDIS_PORT=6379
POSTGRES_PORT=5432
LOG_DIR="/var/log/justclothing"
APP_DIR="/opt/justclothing"
VENV_DIR="$APP_DIR/venv"

# Function to print colored output
print_header() {
    echo -e "\n${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}\n"
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

# Check if running with sudo or as root
if [[ $EUID -ne 0 ]]; then
    print_error "This script must be run as root"
    exit 1
fi

# Main Deployment
main() {
    print_header "JustClothing VPS Deployment Starting"
    echo "Repository Path: $REPO_PATH"
    echo "Domain: $DOMAIN"
    echo "App Directory: $APP_DIR"
    
    step_update_system
    step_create_app_user
    step_install_dependencies
    step_setup_postgresql
    step_setup_redis
    step_setup_minio
    step_copy_application
    step_setup_backend
    step_setup_frontend
    step_setup_nginx
    step_setup_ssl
    step_setup_systemd_services
    step_setup_logging
    step_setup_firewall
    step_final_configuration
    
    print_header "Deployment Complete!"
    print_success "Your application is ready at https://$DOMAIN"
    print_success "Admin panel at https://$DOMAIN/admin"
}

################################################################################
# Step 1: Update System
################################################################################
step_update_system() {
    print_header "Step 1: Updating System Packages"
    
    apt-get update
    apt-get upgrade -y
    
    print_success "System packages updated"
}

################################################################################
# Step 2: Create Application User
################################################################################
step_create_app_user() {
    print_header "Step 2: Creating Application User"
    
    if id "$APP_USER" &>/dev/null; then
        print_warning "User $APP_USER already exists"
    else
        useradd -m -s /bin/bash -d /home/$APP_USER $APP_USER
        print_success "User $APP_USER created"
    fi
}

################################################################################
# Step 3: Install System Dependencies
################################################################################
step_install_dependencies() {
    print_header "Step 3: Installing System Dependencies"
    
    # Build tools
    apt-get install -y build-essential libssl-dev libffi-dev
    
    # Python
    apt-get install -y python3 python3-pip python3-venv python3-dev
    
    # PostgreSQL client and server
    apt-get install -y postgresql postgresql-contrib postgresql-client
    
    # Redis
    apt-get install -y redis-server
    
    # Nginx
    apt-get install -y nginx
    
    # Node.js and npm
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    apt-get install -y nodejs
    
    # Certbot for Let's Encrypt
    apt-get install -y certbot python3-certbot-nginx
    
    # Supervisor for process management (alternative to systemd)
    apt-get install -y supervisor
    
    # Utility packages
    apt-get install -y curl wget git htop
    
    # AWS CLI for S3 operations (optional)
    apt-get install -y awscli
    
    print_success "All system dependencies installed"
}

################################################################################
# Step 4: Setup PostgreSQL
################################################################################
step_setup_postgresql() {
    print_header "Step 4: Setting Up PostgreSQL"
    
    # Start PostgreSQL service
    systemctl start postgresql
    systemctl enable postgresql
    
    # Read database password
    echo -n "Enter PostgreSQL password for justclothing_user: "
    read -s DB_PASSWORD
    echo
    
    # Create database and user
    sudo -u postgres psql << EOF
-- Create database
CREATE DATABASE justclothing_db;

-- Create user
CREATE USER justclothing_user WITH PASSWORD '$DB_PASSWORD';

-- Grant privileges
ALTER ROLE justclothing_user SET client_encoding TO 'utf8';
ALTER ROLE justclothing_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE justclothing_user SET default_transaction_deferrable TO on;
ALTER ROLE justclothing_user SET default_transaction_level TO 'read committed';
ALTER ROLE justclothing_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE justclothing_db TO justclothing_user;

-- Connect to the database and grant schema permissions
\c justclothing_db;
GRANT ALL ON SCHEMA public TO justclothing_user;
EOF
    
    print_success "PostgreSQL database and user created"
}

################################################################################
# Step 5: Setup Redis
################################################################################
step_setup_redis() {
    print_header "Step 5: Setting Up Redis"
    
    # Configure Redis
    cp /etc/redis/redis.conf /etc/redis/redis.conf.backup
    
    # Update Redis configuration
    sed -i 's/^# bind 127.0.0.1/bind 127.0.0.1/' /etc/redis/redis.conf
    sed -i 's/^# requirepass/requirepass/' /etc/redis/redis.conf
    
    # Start Redis
    systemctl start redis-server
    systemctl enable redis-server
    
    print_success "Redis configured and started"
}

################################################################################
# Step 6: Setup MinIO
################################################################################
step_setup_minio() {
    print_header "Step 6: Setting Up MinIO Object Storage"
    
    # Check if MinIO is already running
    if systemctl is-active --quiet minio; then
        print_success "MinIO is already running - skipping setup"
        return 0
    fi
    
    # Create minio user first (before any directory creation)
    if ! id "minio" &>/dev/null; then
        useradd -r -s /bin/false minio
        print_success "Created minio system user"
    else
        print_warning "Minio user already exists"
    fi
    
    # Create MinIO directories
    mkdir -p /opt/minio/data
    mkdir -p /opt/minio/config
    chown -R minio:minio /opt/minio
    chmod -R 755 /opt/minio
    
    # Download MinIO binary
    print_warning "Downloading MinIO binary (this may take a minute)..."
    cd /opt/minio
    curl -L -o minio https://dl.min.io/server/minio/release/linux-amd64/minio 2>/dev/null
    
    if [ ! -f /opt/minio/minio ]; then
        print_error "Failed to download MinIO binary"
        return 1
    fi
    
    chmod +x /opt/minio/minio
    chown minio:minio /opt/minio/minio
    
    # Create environment file for MinIO
    cat > /etc/default/minio << 'EOF'
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123
MINIO_CONFIG_ENV_FILE=/opt/minio/config/minio.env
EOF
    
    # Create simplified systemd service for MinIO
    cat > /etc/systemd/system/minio.service << 'EOF'
[Unit]
Description=MinIO Object Storage Server
Documentation=https://docs.min.io/docs/minio-quickstart-guide
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=minio
Group=minio
ProtectParentDirectories=yes
ProtectHome=yes
NoNewPrivileges=on
PrivateTmp=yes

WorkingDirectory=/opt/minio
EnvironmentFile=/etc/default/minio

# Set environment variables
Environment="MINIO_ROOT_USER=minioadmin"
Environment="MINIO_ROOT_PASSWORD=minioadmin123"

ExecStart=/opt/minio/minio server /opt/minio/data --console-address ":9001"

Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=minio

[Install]
WantedBy=multi-user.target
EOF
    
    # Reload systemd and start MinIO
    systemctl daemon-reload
    sleep 1
    
    # Start MinIO service with error checking
    if ! systemctl start minio; then
        print_error "Failed to start MinIO service"
        echo "MinIO service status:"
        systemctl status minio --no-pager
        echo ""
        echo "MinIO service logs:"
        journalctl -u minio -n 20 --no-pager
        print_warning "Troubleshooting: Check file permissions and logs above"
        print_warning "Try: systemctl status minio / journalctl -u minio -f"
        return 1
    fi
    
    sleep 2
    
    # Check if service is running
    if systemctl is-active --quiet minio; then
        systemctl enable minio
        print_success "MinIO installed and configured"
        print_warning "MinIO Admin Console: http://$(hostname -I | awk '{print $1}'):9001"
        print_warning "MinIO API: http://$(hostname -I | awk '{print $1}'):9000"
        print_warning "MinIO Credentials: minioadmin / minioadmin123"
    else
        print_error "MinIO service is not running"
        echo "Service status:"
        systemctl status minio --no-pager
        echo ""
        echo "Recent logs:"
        journalctl -u minio -n 30 --no-pager
        return 1
    fi
}

################################################################################
# Step 7: Copy Application
################################################################################
step_copy_application() {
    print_header "Step 7: Copying Application Files"
    
    # Create app directory
    mkdir -p $APP_DIR
    
    # Copy repository
    cp -r "$REPO_PATH"/* $APP_DIR/ 2>/dev/null || cp -r "$REPO_PATH"/. $APP_DIR/
    
    # Create necessary directories
    mkdir -p $APP_DIR/media/products $APP_DIR/media/sellers
    mkdir -p $APP_DIR/staticfiles
    mkdir -p $LOG_DIR/{backend,frontend,nginx,celery}
    
    # Set permissions
    chown -R $APP_USER:$APP_GROUP $APP_DIR
    chown -R $APP_USER:$APP_GROUP $LOG_DIR
    chmod -R 755 $LOG_DIR
    
    print_success "Application files copied to $APP_DIR"
}

################################################################################
# Step 8: Setup Backend
################################################################################
step_setup_backend() {
    print_header "Step 8: Setting Up Django Backend"
    
    cd $APP_DIR/backend
    
    # Create Python virtual environment
    python3 -m venv $VENV_DIR
    source $VENV_DIR/bin/activate
    
    # Upgrade pip
    pip install --upgrade pip setuptools wheel
    
    # Install Python dependencies
    pip install -r requirements.txt
    
    # Create .env file
    echo -n "Enter Django SECRET_KEY (or press Enter for auto-generated): "
    read SECRET_KEY
    
    if [ -z "$SECRET_KEY" ]; then
        SECRET_KEY=$(python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')
    fi
    
    echo -n "Enter database password: "
    read -s DB_PASSWORD
    echo
    
    # Create .env file for Django
    cat > $APP_DIR/backend/.env << EOF
# Django Settings
SECRET_KEY=$SECRET_KEY
DEBUG=False
ALLOWED_HOSTS=$DOMAIN,www.$DOMAIN,localhost,127.0.0.1

# Database Configuration
DB_ENGINE=django.db.backends.postgresql
DB_NAME=justclothing_db
DB_USER=justclothing_user
DB_PASSWORD=$DB_PASSWORD
DB_HOST=localhost
DB_PORT=$POSTGRES_PORT

# Redis Configuration
REDIS_URL=redis://127.0.0.1:$REDIS_PORT/0

# Celery Configuration
CELERY_BROKER_URL=redis://127.0.0.1:$REDIS_PORT/0
CELERY_RESULT_BACKEND=redis://127.0.0.1:$REDIS_PORT/0

# MinIO Configuration
MINIO_STORAGE_ENDPOINT=localhost:$MINIO_PORT
MINIO_STORAGE_USE_HTTPS=False
MINIO_STORAGE_MEDIA_URL=http://localhost:$MINIO_PORT/
MINIO_STORAGE_ACCESS_KEY=minioadmin
MINIO_STORAGE_SECRET_KEY=minioadmin123
MINIO_STORAGE_MEDIA_BUCKET_NAME=justclothing-media

# AWS S3 Configuration (Optional)
USE_S3=True
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_STORAGE_BUCKET_NAME=

# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=

# Google OAuth (Optional)
GOOGLE_OAUTH2_CLIENT_ID=
GOOGLE_OAUTH2_CLIENT_SECRET=
EOF
    
    # Run migrations
    source $VENV_DIR/bin/activate
    cd $APP_DIR/backend
    python manage.py migrate
    
    # Collect static files
    python manage.py collectstatic --noinput
    
    # Create superuser
    echo -n "Create superuser? (y/n): "
    read -r CREATE_SUPER
    if [[ $CREATE_SUPER == "y" ]]; then
        python manage.py createsuperuser
    fi
    
    # Change ownership
    chown -R $APP_USER:$APP_GROUP $APP_DIR/backend
    
    print_success "Django backend setup complete"
}

################################################################################
# Step 9: Setup Frontend
################################################################################
step_setup_frontend() {
    print_header "Step 9: Building React Frontend"
    
    cd $APP_DIR/frontend
    
    # Create .env file for frontend (if needed)
    cat > $APP_DIR/frontend/.env.production << EOF
VITE_API_URL=https://$DOMAIN/api
VITE_STATIC_URL=https://$DOMAIN/static
EOF
    
    # Install dependencies
    npm install
    
    # Build for production
    npm run build
    
    # Change ownership
    chown -R $APP_USER:$APP_GROUP $APP_DIR/frontend
    
    print_success "React frontend built successfully"
}

################################################################################
# Step 10: Setup Nginx
################################################################################
step_setup_nginx() {
    print_header "Step 10: Configuring Nginx"
    
    # Remove default nginx config
    rm -f /etc/nginx/sites-enabled/default
    rm -f /etc/nginx/sites-available/default
    
    # Create Nginx configuration for HTTP (will be updated to HTTPS after SSL setup)
    cat > /etc/nginx/sites-available/justclothing << 'EOF'
upstream backend {
    server 127.0.0.1:8000;
    keepalive 32;
}

upstream minio {
    server 127.0.0.1:9000;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name _;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS Server (certificate paths will be updated after SSL setup)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;
    
    # SSL certificates (will be created by certbot)
    ssl_certificate /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Logging
    access_log /var/log/justclothing/nginx/access.log;
    error_log /var/log/justclothing/nginx/error.log;
    
    # Increase client max body size for file uploads
    client_max_body_size 100M;
    
    # Frontend - Root path
    location / {
        root /opt/justclothing/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache busting for assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 365d;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API routes
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Django Admin
    location /admin/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # API Documentation (Swagger, ReDoc)
    location /swagger/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /redoc/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static files
    location /static/ {
        alias /opt/justclothing/backend/staticfiles/;
        expires 30d;
        add_header Cache-Control "public";
    }
    
    # Media files
    location /media/ {
        alias /opt/justclothing/backend/media/;
        expires 7d;
        add_header Cache-Control "public";
    }
    
    # MinIO proxy (Object Storage)
    location /minio/ {
        proxy_pass http://minio/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Deny access to sensitive files
    location ~ /\. {
        deny all;
    }
    
    location ~ ~$ {
        deny all;
    }
}
EOF
    
    # Replace domain placeholder
    sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /etc/nginx/sites-available/justclothing
    
    # Enable the site
    ln -sf /etc/nginx/sites-available/justclothing /etc/nginx/sites-enabled/justclothing
    
    # Test nginx configuration
    nginx -t
    
    # Start nginx
    systemctl start nginx
    systemctl enable nginx
    
    print_success "Nginx configured and started"
}

################################################################################
# Step 11: Setup SSL with Let's Encrypt
################################################################################
step_setup_ssl() {
    print_header "Step 11: Setting Up SSL Certificate with Let's Encrypt"
    
    # Create directory for certbot
    mkdir -p /var/www/certbot
    
    # Get SSL certificate
    print_warning "Starting SSL certificate setup..."
    print_warning "Make sure your domain DNS is pointing to this server's IP address"
    
    certbot certonly --webroot \
        -w /var/www/certbot \
        -d $DOMAIN \
        -d www.$DOMAIN \
        --email $EMAIL \
        --agree-tos \
        --non-interactive \
        --expand
    
    # Create certbot renewal hook for nginx reload
    mkdir -p /etc/letsencrypt/renewal-hooks/post
    cat > /etc/letsencrypt/renewal-hooks/post/nginx.sh << 'EOF'
#!/bin/bash
systemctl reload nginx
EOF
    chmod +x /etc/letsencrypt/renewal-hooks/post/nginx.sh
    
    # Setup automatic renewal
    systemctl enable certbot.timer
    systemctl start certbot.timer
    
    # Reload nginx with SSL
    systemctl reload nginx
    
    print_success "SSL certificate installed and configured"
}

################################################################################
# Step 12: Setup Systemd Services
################################################################################
step_setup_systemd_services() {
    print_header "Step 12: Setting Up Systemd Services"
    
    # Gunicorn service for Django
    cat > /etc/systemd/system/gunicorn-justclothing.service << EOF
[Unit]
Description=Gunicorn WSGI HTTP Server for JustClothing
After=network.target

[Service]
Type=notify
User=$APP_USER
Group=$APP_GROUP
WorkingDirectory=$APP_DIR/backend
EnvironmentFile=$APP_DIR/backend/.env
ExecStart=$VENV_DIR/bin/gunicorn \\
    --workers 4 \\
    --worker-class sync \\
    --bind 127.0.0.1:$BACKEND_PORT \\
    --timeout 60 \\
    --access-logfile $LOG_DIR/backend/access.log \\
    --error-logfile $LOG_DIR/backend/error.log \\
    justclothing.wsgi:application

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    
    # Celery worker service
    cat > /etc/systemd/system/celery-justclothing.service << EOF
[Unit]
Description=Celery Worker for JustClothing
After=network.target

[Service]
Type=forking
User=$APP_USER
Group=$APP_GROUP
WorkingDirectory=$APP_DIR/backend
EnvironmentFile=$APP_DIR/backend/.env
ExecStart=$VENV_DIR/bin/celery -A justclothing worker \\
    -l info \\
    --logfile=$LOG_DIR/celery/worker.log \\
    --pidfile=$APP_DIR/celery_worker.pid

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    
    # Celery Beat service (scheduler)
    cat > /etc/systemd/system/celery-beat-justclothing.service << EOF
[Unit]
Description=Celery Beat Scheduler for JustClothing
After=network.target

[Service]
Type=simple
User=$APP_USER
Group=$APP_GROUP
WorkingDirectory=$APP_DIR/backend
EnvironmentFile=$APP_DIR/backend/.env
ExecStart=$VENV_DIR/bin/celery -A justclothing beat \\
    -l info \\
    --logfile=$LOG_DIR/celery/beat.log \\
    --scheduler django_celery_beat.schedulers:DatabaseScheduler

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    
    # Reload systemd daemon
    systemctl daemon-reload
    
    # Enable and start services
    systemctl enable gunicorn-justclothing
    systemctl enable celery-justclothing
    systemctl enable celery-beat-justclothing
    
    systemctl start gunicorn-justclothing
    systemctl start celery-justclothing
    systemctl start celery-beat-justclothing
    
    print_success "Systemd services created and started"
}

################################################################################
# Step 13: Setup Logging
################################################################################
step_setup_logging() {
    print_header "Step 13: Setting Up Logging"
    
    # Create logrotate configuration
    cat > /etc/logrotate.d/justclothing << EOF
$LOG_DIR/backend/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 $APP_USER $APP_GROUP
    sharedscripts
    postrotate
        systemctl reload gunicorn-justclothing > /dev/null 2>&1 || true
    endscript
}

$LOG_DIR/celery/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 $APP_USER $APP_GROUP
}

$LOG_DIR/nginx/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        systemctl reload nginx > /dev/null 2>&1 || true
    endscript
}
EOF
    
    # Set up journalctl persistent logging
    mkdir -p /var/log/journal
    systemctl restart systemd-journald
    
    print_success "Logging configured"
}

################################################################################
# Step 14: Setup Firewall
################################################################################
step_setup_firewall() {
    print_header "Step 14: Configuring UFW Firewall"
    
    # Enable UFW
    ufw --force enable
    
    # Default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH
    ufw allow 22/tcp
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # MinIO API (optional, restrict to specific IPs in production)
    # ufw allow from 192.168.0.0/16 to any port 9000
    
    print_success "Firewall configured"
}

################################################################################
# Step 15: Final Configuration
################################################################################
step_final_configuration() {
    print_header "Step 15: Final Configuration and Health Check"
    
    # Create management script
    cat > $APP_DIR/manage-deployment.sh << 'EOF'
#!/bin/bash

case "$1" in
    status)
        echo "=== Service Status ==="
        systemctl status gunicorn-justclothing --no-pager
        echo ""
        systemctl status celery-justclothing --no-pager
        echo ""
        systemctl status celery-beat-justclothing --no-pager
        echo ""
        systemctl status nginx --no-pager
        echo ""
        systemctl status redis-server --no-pager
        echo ""
        systemctl status postgresql --no-pager
        ;;
    restart-backend)
        systemctl restart gunicorn-justclothing
        echo "Backend restarted"
        ;;
    restart-celery)
        systemctl restart celery-justclothing
        systemctl restart celery-beat-justclothing
        echo "Celery services restarted"
        ;;
    restart-nginx)
        systemctl reload nginx
        echo "Nginx reloaded"
        ;;
    logs-backend)
        journalctl -u gunicorn-justclothing -f
        ;;
    logs-celery)
        tail -f /var/log/justclothing/celery/worker.log
        ;;
    logs-nginx)
        tail -f /var/log/justclothing/nginx/error.log
        ;;
    update)
        cd /opt/justclothing/backend
        source /opt/justclothing/venv/bin/activate
        git pull
        pip install -r requirements.txt
        python manage.py migrate
        python manage.py collectstatic --noinput
        systemctl restart gunicorn-justclothing
        echo "Backend updated and restarted"
        ;;
    *)
        echo "Usage: $0 {status|restart-backend|restart-celery|restart-nginx|logs-backend|logs-celery|logs-nginx|update}"
        exit 1
        ;;
esac
EOF
    chmod +x $APP_DIR/manage-deployment.sh
    
    # Create summary file
    cat > $APP_DIR/DEPLOYMENT_INFO.txt << EOF
=== JustClothing VPS Deployment Summary ===
Deployment Date: $(date)

DOMAIN: $DOMAIN
APP_DIR: $APP_DIR
VENV: $VENV_DIR
LOG_DIR: $LOG_DIR

SERVICES:
- Gunicorn (Django Backend): 127.0.0.1:$BACKEND_PORT
- Celery Worker
- Celery Beat
- Nginx Web Server: Port 80, 443
- PostgreSQL: localhost:$POSTGRES_PORT
- Redis: localhost:$REDIS_PORT
- MinIO: localhost:$MINIO_PORT

COMMON COMMANDS:
- Check service status: sudo $APP_DIR/manage-deployment.sh status
- Restart backend: sudo $APP_DIR/manage-deployment.sh restart-backend
- View backend logs: sudo $APP_DIR/manage-deployment.sh logs-backend
- View Celery logs: sudo $APP_DIR/manage-deployment.sh logs-celery
- View Nginx logs: sudo $APP_DIR/manage-deployment.sh logs-nginx
- Update application: sudo $APP_DIR/manage-deployment.sh update

MANUAL COMMANDS:
- Activate virtualenv: source $VENV_DIR/bin/activate
- Django admin: cd $APP_DIR/backend && python manage.py shell
- View app logs: journalctl -u gunicorn-justclothing -f
- Monitor services: systemctl status [service-name]

SSL CERTIFICATE:
- Path: /etc/letsencrypt/live/$DOMAIN/
- Auto-renewal: Enabled via certbot.timer
- Renewal log: journalctl -u certbot.service -f

NEXT STEPS:
1. Verify all services are running: sudo systemctl status gunicorn-justclothing
2. Check the application: https://$DOMAIN
3. Access admin panel: https://$DOMAIN/admin
4. Configure email settings in Django admin
5. Set up backups and monitoring

DATABASE BACKUP:
pg_dump -U justclothing_user justclothing_db > backup.sql

EOF
    
    # Print summary
    cat $APP_DIR/DEPLOYMENT_INFO.txt
    
    # Health checks
    print_header "Health Checks"
    
    echo -n "Checking PostgreSQL... "
    if systemctl is-active --quiet postgresql; then
        print_success "PostgreSQL is running"
    else
        print_error "PostgreSQL is not running"
    fi
    
    echo -n "Checking Redis... "
    if systemctl is-active --quiet redis-server; then
        print_success "Redis is running"
    else
        print_error "Redis is not running"
    fi
    
    echo -n "Checking Nginx... "
    if systemctl is-active --quiet nginx; then
        print_success "Nginx is running"
    else
        print_error "Nginx is not running"
    fi
    
    echo -n "Checking Gunicorn... "
    if systemctl is-active --quiet gunicorn-justclothing; then
        print_success "Gunicorn is running"
    else
        print_error "Gunicorn is not running"
    fi
    
    echo -n "Checking Celery Worker... "
    if systemctl is-active --quiet celery-justclothing; then
        print_success "Celery Worker is running"
    else
        print_error "Celery Worker is not running"
    fi
    
    echo ""
    print_success "Deployment configuration complete"
}

# Run main deployment
main "$@"
