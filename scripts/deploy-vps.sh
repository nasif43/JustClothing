#!/bin/bash

###############################################################################
# JustClothing VPS Deployment Script (Native)
# This script deploys the application without Docker
# Usage: sudo bash deploy-vps.sh
###############################################################################

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_USER="justclothing"
APP_HOME="/home/$APP_USER/justclothing"
DOMAIN="${DOMAIN:-example.com}"
BACKEND_PORT=8000
REDIS_PORT=6379
POSTGRES_PORT=5432
POSTGRES_DB="justclothing_db"
POSTGRES_USER="justclothing_user"
POSTGRES_PASSWORD="${DB_PASSWORD:-changeMe123!}"

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    log_error "This script must be run as root (use: sudo bash deploy-vps.sh)"
fi

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --domain)
            DOMAIN="$2"
            shift 2
            ;;
        --db-password)
            POSTGRES_PASSWORD="$2"
            shift 2
            ;;
        --app-user)
            APP_USER="$2"
            APP_HOME="/home/$APP_USER/justclothing"
            shift 2
            ;;
        *)
            log_warning "Unknown option: $1"
            shift
            ;;
    esac
done

log_info "Starting JustClothing VPS deployment..."
log_info "Domain: $DOMAIN"
log_info "App User: $APP_USER"
log_info "App Home: $APP_HOME"

###############################################################################
# Step 1: Update system packages
###############################################################################
log_info "Step 1: Updating system packages..."
apt-get update
apt-get upgrade -y
apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    postgresql \
    postgresql-contrib \
    redis-server \
    nginx \
    supervisor \
    ssl-cert \
    certbot \
    python3-certbot-nginx \
    ufw \
    git \
    vim \
    htop \
    net-tools

log_success "System packages installed"

# Install Node.js v20+ (required for react-router-dom v7+)
log_info "Installing Node.js v20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

log_success "Node.js $(node --version) installed"

###############################################################################
# Step 2: Create application user
###############################################################################
log_info "Step 2: Setting up application user..."

if id "$APP_USER" &>/dev/null; then
    log_warning "User $APP_USER already exists"
else
    useradd -m -s /bin/bash $APP_USER
    log_success "User $APP_USER created"
fi

###############################################################################
# Step 3: Setup PostgreSQL Database
###############################################################################
log_info "Step 3: Setting up PostgreSQL database..."

# Start PostgreSQL
systemctl start postgresql || true
systemctl enable postgresql

# Create database and user
sudo -u postgres psql -v ON_ERROR_STOP=1 <<-EOSQL
    -- Drop if exists (for fresh setup)
    DROP DATABASE IF EXISTS $POSTGRES_DB;
    DROP USER IF EXISTS $POSTGRES_USER;
    
    -- Create user
    CREATE USER $POSTGRES_USER WITH PASSWORD '$POSTGRES_PASSWORD';
    
    -- Create database
    CREATE DATABASE $POSTGRES_DB OWNER $POSTGRES_USER;
    
    -- Grant privileges
    GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $POSTGRES_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $POSTGRES_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $POSTGRES_USER;
EOSQL

log_success "PostgreSQL database configured"

###############################################################################
# Step 4: Setup Redis
###############################################################################
log_info "Step 4: Setting up Redis..."

systemctl start redis-server
systemctl enable redis-server

# Configure Redis
sed -i 's/# maxmemory <bytes>/maxmemory 512mb/' /etc/redis/redis.conf
sed -i 's/# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf

systemctl restart redis-server

log_success "Redis configured and running"

###############################################################################
# Step 5: Clone/Prepare application code
###############################################################################
log_info "Step 5: Preparing application code..."

# Copy application code to app home
mkdir -p $APP_HOME
chown -R $APP_USER:$APP_USER $APP_HOME

# If code already exists, pull latest; otherwise clone
if [ -d "$APP_HOME/.git" ]; then
    log_info "Repository exists, pulling latest changes..."
    cd $APP_HOME
    sudo -u $APP_USER git pull
else
    log_warning "Please ensure application code is in $APP_HOME"
    log_info "You can copy your code with: sudo cp -r /path/to/justclothing/* $APP_HOME/"
    log_info "Waiting for user confirmation..."
    read -p "Press Enter once you've copied the code to $APP_HOME..."
fi

log_success "Application code prepared"

###############################################################################
# Step 6: Setup Python Virtual Environment and Dependencies
###############################################################################
log_info "Step 6: Setting up Python virtual environment..."

cd $APP_HOME

# Create virtual environment
sudo -u $APP_USER python3 -m venv venv
log_success "Virtual environment created"

# Upgrade pip
sudo -u $APP_USER ./venv/bin/pip install --upgrade pip setuptools wheel

# Install Python dependencies
log_info "Installing Python dependencies..."
sudo -u $APP_USER ./venv/bin/pip install -r backend/requirements.txt
log_success "Python dependencies installed"

###############################################################################
# Step 7: Setup Node.js and Frontend
###############################################################################
log_info "Step 7: Setting up Node.js frontend..."

# Ensure frontend directory has correct permissions
chown -R $APP_USER:$APP_USER $APP_HOME/frontend

cd $APP_HOME/frontend

# Install npm dependencies as the app user
# Use --unsafe-perm to allow npm to run scripts
sudo -u $APP_USER npm install --unsafe-perm

log_info "Building frontend..."
sudo -u $APP_USER npm run build

log_success "Frontend built successfully"

###############################################################################
# Step 8: Configure Django Settings
###############################################################################
log_info "Step 8: Configuring Django..."

# Ensure backend directory has correct permissions
chown -R $APP_USER:$APP_USER $APP_HOME/backend

cd $APP_HOME/backend

# Create .env file
cat > .env <<EOF
DEBUG=False
SECRET_KEY=$(python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')
ALLOWED_HOSTS=$DOMAIN,www.$DOMAIN,127.0.0.1,localhost
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=$POSTGRES_DB
DB_USER=$POSTGRES_USER
DB_PASSWORD=$POSTGRES_PASSWORD
DB_HOST=127.0.0.1
DB_PORT=$POSTGRES_PORT

# Redis
REDIS_URL=redis://127.0.0.1:$REDIS_PORT/0
CELERY_BROKER_URL=redis://127.0.0.1:$REDIS_PORT/0
CELERY_RESULT_BACKEND=redis://127.0.0.1:$REDIS_PORT/0

# Frontend
FRONTEND_URL=https://$DOMAIN
CORS_ALLOWED_ORIGINS=https://$DOMAIN,https://www.$DOMAIN

# Email (configure as needed)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# S3/Minio (if using)
USE_S3=False
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_STORAGE_BUCKET_NAME=
EOF

chown $APP_USER:$APP_USER .env

log_success "Django configuration created at backend/.env"

###############################################################################
# Step 9: Setup Database Migrations
###############################################################################
log_info "Step 9: Running database migrations..."

cd $APP_HOME
sudo -u $APP_USER ./venv/bin/python backend/manage.py migrate

log_success "Database migrations completed"

###############################################################################
# Step 10: Collect Static Files
###############################################################################
log_info "Step 10: Collecting static files..."

cd $APP_HOME
sudo -u $APP_USER ./venv/bin/python backend/manage.py collectstatic --noinput

log_success "Static files collected"

###############################################################################
# Step 11: Create Supervisor Configuration for Django + Gunicorn
###############################################################################
log_info "Step 11: Configuring Supervisor for application processes..."

# Install Gunicorn
sudo -u $APP_USER $APP_HOME/venv/bin/pip install gunicorn

# Gunicorn configuration
cat > /etc/supervisor/conf.d/gunicorn.conf <<EOF
[program:gunicorn]
directory=$APP_HOME/backend
command=$APP_HOME/venv/bin/gunicorn \\
    --workers 4 \\
    --worker-class sync \\
    --bind 127.0.0.1:$BACKEND_PORT \\
    --timeout 60 \\
    --access-logfile /var/log/gunicorn-access.log \\
    --error-logfile /var/log/gunicorn-error.log \\
    justclothing.wsgi:application

user=$APP_USER
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/gunicorn.log
EOF

# Celery Worker configuration
cat > /etc/supervisor/conf.d/celery.conf <<EOF
[program:celery]
directory=$APP_HOME/backend
command=$APP_HOME/venv/bin/celery -A justclothing worker \\
    --loglevel=info \\
    --concurrency=4 \\
    --logfile=/var/log/celery.log

user=$APP_USER
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/celery-worker.log
EOF

# Celery Beat configuration
cat > /etc/supervisor/conf.d/celery-beat.conf <<EOF
[program:celery-beat]
directory=$APP_HOME/backend
command=$APP_HOME/venv/bin/celery -A justclothing beat \\
    --loglevel=info \\
    --logfile=/var/log/celery-beat.log

user=$APP_USER
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/celery-beat.log
EOF

log_success "Supervisor configurations created"

###############################################################################
# Step 12: Configure Nginx as Reverse Proxy
###############################################################################
log_info "Step 12: Configuring Nginx..."

# Create Nginx configuration
cat > /etc/nginx/sites-available/justclothing <<'EOF'
upstream gunicorn {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;
    client_max_body_size 100M;

    location / {
        proxy_pass http://gunicorn;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /static/ {
        alias /home/APP_USER_PLACEHOLDER/justclothing/backend/staticfiles/;
    }

    location /media/ {
        alias /home/APP_USER_PLACEHOLDER/justclothing/backend/media/;
    }
}
EOF

# Replace placeholders
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /etc/nginx/sites-available/justclothing
sed -i "s/APP_USER_PLACEHOLDER/$APP_USER/g" /etc/nginx/sites-available/justclothing

# Enable site
ln -sf /etc/nginx/sites-available/justclothing /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx config
nginx -t

# Restart Nginx
systemctl restart nginx
systemctl enable nginx

log_success "Nginx configured"

###############################################################################
# Step 13: Setup SSL Certificate (Let's Encrypt)
###############################################################################
log_info "Step 13: Setting up SSL certificate..."

if [ "$DOMAIN" != "example.com" ]; then
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --agree-tos --non-interactive --email admin@$DOMAIN || log_warning "SSL setup failed - configure manually or use self-signed cert"
else
    log_warning "Using example.com domain - configure SSL manually with your actual domain"
fi

log_success "SSL configured"

###############################################################################
# Step 14: Setup Firewall
###############################################################################
log_info "Step 14: Configuring UFW firewall..."

ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable -y

log_success "Firewall configured"

###############################################################################
# Step 15: Start Application Services
###############################################################################
log_info "Step 15: Starting application services..."

supervisorctl reread
supervisorctl update
supervisorctl start all

systemctl restart nginx
systemctl restart redis-server
systemctl restart postgresql

log_success "All services started"

###############################################################################
# Step 16: Setup Log Rotation
###############################################################################
log_info "Step 16: Setting up log rotation..."

cat > /etc/logrotate.d/justclothing <<EOF
/var/log/gunicorn*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 $APP_USER $APP_USER
    sharedscripts
    postrotate
        supervisorctl restart gunicorn > /dev/null
    endscript
}

/var/log/celery*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 $APP_USER $APP_USER
    sharedscripts
    postrotate
        supervisorctl restart celery celery-beat > /dev/null
    endscript
}
EOF

log_success "Log rotation configured"

###############################################################################
# Deployment Complete
###############################################################################
log_success "=========================================="
log_success "JustClothing VPS Deployment Complete!"
log_success "=========================================="
echo ""
log_info "Important Information:"
echo "  • Domain: https://$DOMAIN"
echo "  • Backend API: https://$DOMAIN/api/"
echo "  • Admin: https://$DOMAIN/admin/"
echo "  • App Location: $APP_HOME"
echo "  • App User: $APP_USER"
echo ""
log_info "Service Management:"
echo "  • View logs: supervisorctl tail -f gunicorn"
echo "  • Restart app: supervisorctl restart gunicorn"
echo "  • Status: supervisorctl status"
echo ""
log_info "Next Steps:"
echo "  1. Update .env file with your settings: $APP_HOME/backend/.env"
echo "  2. Create superuser: cd $APP_HOME && sudo -u $APP_USER ./venv/bin/python backend/manage.py createsuperuser"
echo "  3. Check status: supervisorctl status"
echo "  4. View logs: tail -f /var/log/gunicorn.log"
echo ""
log_warning "TODO - Configure in .env:"
echo "  • EMAIL settings"
echo "  • S3/Storage settings if needed"
echo "  • Any API keys or third-party integrations"
echo ""
