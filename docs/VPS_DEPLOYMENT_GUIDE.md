# VPS Deployment Guide

## Pre-Deployment Checklist

Before running the deployment script, ensure you have:

1. **VPS Server** - Ubuntu 20.04 LTS or newer (recommended)
2. **Domain Name** - DNS records pointing to your VPS IP
3. **SSH Access** - Root or sudo-enabled user account
4. **Internet Connection** - At least 100 Mbps recommended
5. **Storage** - Minimum 50GB available space

## Quick Start

### 1. Clone the Repository
```bash
cd /home/ubuntu  # or your preferred directory
git clone <your-repo-url> JustClothing
cd JustClothing
```

### 2. Run the Deployment Script
```bash
# Make script executable
chmod +x scripts/deploy-vps.sh

# Run the deployment (will prompt for passwords and configuration)
sudo bash scripts/deploy-vps.sh . justclothing.store admin@justclothing.store
```

### 3. Follow the Interactive Prompts
- Enter PostgreSQL password
- Enter Django SECRET_KEY (or let it auto-generate)
- Choose whether to create a superuser

### 4. Verify Installation
```bash
# Check service status
sudo /opt/justclothing/manage-deployment.sh status

# Check if you can access the site
curl -k https://localhost  # k flag ignores SSL self-signed warning during testing
```

## Deployment Script Parameters

```bash
Usage: sudo bash deploy-vps.sh <repo-path> <domain> <email>

Arguments:
  repo-path    : Path to the cloned repository (default: .)
  domain       : Your domain name (default: justclothing.store)
  email        : Email for Let's Encrypt certificate (default: admin@justclothing.store)

Example:
  sudo bash scripts/deploy-vps.sh . example.com admin@example.com
```

## Post-Deployment Configuration

### 1. Environment Variables
Edit `/opt/justclothing/backend/.env`:
```bash
sudo nano /opt/justclothing/backend/.env
```

Key variables to update:
- `AWS_ACCESS_KEY_ID` - If using S3 instead of MinIO
- `AWS_SECRET_ACCESS_KEY` - If using S3
- `EMAIL_HOST_USER` - Your email for email notifications
- `EMAIL_HOST_PASSWORD` - Your email app password
- `GOOGLE_OAUTH2_CLIENT_ID` - If using Google OAuth

### 2. MinIO Setup (Object Storage)

Access MinIO console at: `http://<your-ip>:9001`
- Default username: `minioadmin`
- Default password: `minioadmin123`

Create buckets:
```bash
# Install MinIO client
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
./mc alias set minio http://localhost:9000 minioadmin minioadmin123

# Create buckets
./mc mb minio/justclothing-media
./mc mb minio/justclothing-static
```

### 3. Django Administration

Access Django admin at: `https://<your-domain>/admin`
- Use the superuser credentials you created during deployment

Important configurations:
- Add Site domain in Django admin → Sites
- Configure email settings
- Set up payment provider credentials
- Configure external services

### 4. HTTPS/SSL Certificate

The deployment script automatically installs and configures Let's Encrypt SSL.

Certificate renewal is automatic via `certbot.timer`.

To verify renewal:
```bash
sudo certbot renew --dry-run
```

### 5. Database Backups

Create automated backups:
```bash
# Create backup script
sudo cat > /opt/justclothing/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/justclothing/backups"
mkdir -p "$BACKUP_DIR"
DATE=$(date +\%Y\%m\%d_\%H\%M\%S)
sudo -u postgres pg_dump -Fc justclothing_db > "$BACKUP_DIR/backup_$DATE.sql"
# Keep only last 30 days of backups
find "$BACKUP_DIR" -name "backup_*.sql" -mtime +30 -delete
EOF

sudo chmod +x /opt/justclothing/backup-db.sh

# Add to crontab for daily 2 AM backups
echo "0 2 * * * /opt/justclothing/backup-db.sh" | sudo crontab -
```

Restore backup:
```bash
sudo -u postgres pg_restore -d justclothing_db /path/to/backup_file.sql
systemctl restart gunicorn-justclothing
```

## Service Management

### View Service Status
```bash
sudo /opt/justclothing/manage-deployment.sh status
```

### Restart Services
```bash
# Restart backend
sudo /opt/justclothing/manage-deployment.sh restart-backend

# Restart Celery (background jobs)
sudo /opt/justclothing/manage-deployment.sh restart-celery

# Reload Nginx
sudo /opt/justclothing/manage-deployment.sh restart-nginx
```

### View Logs
```bash
# Backend logs
sudo /opt/justclothing/manage-deployment.sh logs-backend

# Celery logs
sudo /opt/justclothing/manage-deployment.sh logs-celery

# Nginx logs
sudo /opt/justclothing/manage-deployment.sh logs-nginx

# System logs
sudo journalctl -u gunicorn-justclothing -f
sudo journalctl -u celery-justclothing -f
```

### Manual Service Control
```bash
sudo systemctl restart gunicorn-justclothing
sudo systemctl restart celery-justclothing
sudo systemctl restart celery-beat-justclothing
sudo systemctl restart nginx
```

## Monitoring and Maintenance

### System Monitoring
```bash
# Check disk space
df -h

# Check CPU and memory
top
# or
htop  # prettier version

# Check log file sizes
du -sh /var/log/justclothing/*
```

### Application Health
```bash
# Check backend connectivity
curl -k https://localhost/api/health

# Check if database is accessible
sudo -u postgres psql -d justclothing_db -c "SELECT 1;"

# Check Redis connectivity
redis-cli ping  # Should return PONG

# Check Celery status
sudo tail -f /var/log/justclothing/celery/worker.log
```

### Performance Optimization

#### Nginx Caching
The deployment already includes:
- Browser caching for static assets (365 days)
- Compression enabled
- Gzip for response bodies

#### Database Performance
```bash
# Connect to database
sudo -u postgres psql -d justclothing_db

# Check slow queries
\d  # List tables
SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC;
```

#### Redis Monitoring
```bash
redis-cli info stats
redis-cli monitor  # Real-time command monitoring
```

## Troubleshooting

### Backend Not Starting
```bash
# Check logs
sudo journalctl -u gunicorn-justclothing -f

# Check if port is in use
lsof -i :8000

# Test Python environment
source /opt/justclothing/venv/bin/activate
python /opt/justclothing/backend/manage.py shell
```

### Nginx Not Working
```bash
# Test configuration
sudo nginx -t

# Check if port is in use
lsof -i :80
lsof -i :443

# Check nginx error logs
sudo tail -100 /var/log/justclothing/nginx/error.log
```

### Database Connection Issues
```bash
# Connect directly
sudo -u postgres psql -d justclothing_db

# Check connection from backend
cd /opt/justclothing/backend
source /opt/justclothing/venv/bin/activate
python manage.py dbshell
```

### Celery Not Processing Tasks
```bash
# Check if Celery worker is running
sudo systemctl status celery-justclothing

# View Celery worker logs
sudo tail -100 /var/log/justclothing/celery/worker.log

# Restart Celery
sudo systemctl restart celery-justclothing celery-beat-justclothing
```

### SSL Certificate Issues
```bash
# Check certificate expiration
sudo certbot certificates

# Renew certificate manually
sudo certbot renew -v

# Check renewal logs
sudo journalctl -u certbot.service -f
```

## Security Hardening

### Update Django Settings
Edit `/opt/justclothing/backend/.env`:
```
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

### Firewall Configuration
```bash
# Current rules
sudo ufw status

# Block specific ports (example)
sudo ufw deny 22  # Restrict SSH if needed
sudo ufw deny 9000  # Restrict MinIO to private network only

# Allow from specific IP
sudo ufw allow from 203.0.113.0 to any port 22

# Delete rule
sudo ufw delete allow 80/tcp
```

### SSH Hardening
Edit `/etc/ssh/sshd_config`:
```bash
sudo nano /etc/ssh/sshd_config

# Recommended settings:
# PasswordAuthentication no
# PermitRootLogin no
# X11Forwarding no
# MaxAuthTries 3

sudo systemctl restart sshd
```

## Updating the Application

### Update Backend Code
```bash
cd /opt/justclothing
sudo bash manage-deployment.sh update
```

Or manually:
```bash
cd /opt/justclothing/backend
sudo -u justclothing git pull origin main
sudo -u justclothing /opt/justclothing/venv/bin/pip install -r requirements.txt
sudo -u justclothing /opt/justclothing/venv/bin/python manage.py migrate
sudo -u justclothing /opt/justclothing/venv/bin/python manage.py collectstatic --noinput
sudo systemctl restart gunicorn-justclothing
```

### Update Frontend
```bash
cd /opt/justclothing/frontend
sudo -u justclothing git pull origin main
sudo -u justclothing npm install
sudo -u justclothing npm run build
sudo systemctl reload nginx
```

## Scaling Considerations

### Increase Gunicorn Workers
Edit `/etc/systemd/system/gunicorn-justclothing.service`:
```bash
sudo nano /etc/systemd/system/gunicorn-justclothing.service

# Change workers parameter (usually: 2 * CPU_CORES + 1)
--workers 8

sudo systemctl daemon-reload
sudo systemctl restart gunicorn-justclothing
```

### Multiple Celery Workers
Create additional Celery worker services:
```bash
sudo cp /etc/systemd/system/celery-justclothing.service \
        /etc/systemd/system/celery-justclothing-2.service

# Edit and adjust the new service
sudo nano /etc/systemd/system/celery-justclothing-2.service

# Change pidfile and logfile to different locations
sudo systemctl enable celery-justclothing-2
sudo systemctl start celery-justclothing-2
```

### Load Balancing
For multiple backend servers, consider using:
- HAProxy for load balancing
- Keepalived for high availability
- Redis Sentinel for cache failover

## Support and Resources

- Django Documentation: https://docs.djangoproject.com/
- Gunicorn Documentation: https://docs.gunicorn.org/
- Nginx Documentation: https://nginx.org/en/docs/
- Celery Documentation: https://docs.celeryproject.io/
- Let's Encrypt: https://letsencrypt.org/

## Deployment Info

Full deployment information saved at: `/opt/justclothing/DEPLOYMENT_INFO.txt`
