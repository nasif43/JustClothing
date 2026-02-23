# VPS Deployment Guide (Native - No Docker)

This guide explains how to deploy JustClothing on a VPS without Docker.

## Prerequisites

- Ubuntu 20.04 LTS or later (or equivalent Linux distribution)
- Root access or sudo privileges
- Domain name configured and pointing to your VPS
- Minimum 2GB RAM, 20GB disk space recommended

## Quick Start

### 1. Initial Deployment

```bash
# Download the deployment script
sudo bash scripts/deploy-vps.sh

# Or with custom settings
sudo bash scripts/deploy-vps.sh --domain yourdomain.com --db-password your_secure_password
```

### 2. Post-Deployment Configuration

After deployment completes:

```bash
# Edit the Django configuration
sudo nano /home/justclothing/justclothing/backend/.env

# Create a superuser
sudo supervisorctl status  # verify services are running
cd /home/justclothing/justclothing
sudo -u justclothing ./venv/bin/python backend/manage.py createsuperuser
```

### 3. Access Your Application

- Frontend: `https://yourdomain.com`
- Admin: `https://yourdomain.com/admin`
- API: `https://yourdomain.com/api`

## Architecture

### Services Installed

1. **PostgreSQL** - Database
2. **Redis** - Cache and message broker
3. **Gunicorn** - Python application server
4. **Celery** - Task queue
5. **Nginx** - Reverse proxy and web server
6. **Supervisor** - Process manager

### Directory Structure

```
/home/justclothing/justclothing/
├── backend/              # Django application
│   ├── manage.py
│   ├── requirements.txt
│   ├── justclothing/    # Settings
│   ├── apps/            # Django apps
│   ├── staticfiles/      # Collected static files
│   ├── media/           # User uploads
│   └── .env             # Environment configuration
├── frontend/            # React application
│   ├── src/
│   ├── package.json
│   └── dist/            # Built files
└── venv/                # Python virtual environment
```

## Daily Operations

### Using Operations Utility

```bash
# Run the interactive menu
sudo bash scripts/ops-utils.sh

# Or run specific commands
sudo bash scripts/ops-utils.sh status          # View service status
sudo bash scripts/ops-utils.sh logs-gunicorn   # View gunicorn logs
sudo bash scripts/ops-utils.sh restart-all     # Restart all services
sudo bash scripts/ops-utils.sh backup           # Backup database
```

### Quick Update Deployment

```bash
# Pull latest code and restart services
sudo bash scripts/deploy-quick.sh
```

## Service Management

### Using Supervisor

```bash
# View all services
sudo supervisorctl status

# Restart specific service
sudo supervisorctl restart gunicorn
sudo supervisorctl restart celery
sudo supervisorctl restart celery-beat

# Restart all
sudo supervisorctl restart all

# View logs
sudo supervisorctl tail -f gunicorn
sudo supervisorctl tail -f celery
```

### Using Systemctl

```bash
# PostgreSQL
sudo systemctl restart postgresql
sudo systemctl status postgresql

# Redis
sudo systemctl restart redis-server
sudo systemctl status redis-server

# Nginx
sudo systemctl restart nginx
sudo systemctl status nginx
```

## Logs

Logs are located at:

- Gunicorn: `/var/log/gunicorn.log`
- Celery: `/var/log/celery-worker.log`
- Celery Beat: `/var/log/celery-beat.log`
- Nginx access: `/var/log/nginx/access.log`
- Nginx error: `/var/log/nginx/error.log`
- PostgreSQL: `/var/log/postgresql/`

View live logs:
```bash
sudo tail -f /var/log/gunicorn.log
sudo tail -f /var/log/celery-worker.log
```

## Configuration

### Environment Variables (.env)

Edit `/home/justclothing/justclothing/backend/.env`:

```env
# Debug (set to False in production)
DEBUG=False

# Secret key (already generated)
SECRET_KEY=your-generated-key

# Database
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=justclothing_db
DB_USER=justclothing_user
DB_PASSWORD=your_password

# Redis
REDIS_URL=redis://127.0.0.1:6379/0

# Domain
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Email
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# S3/Storage (if using)
USE_S3=False
```

### Nginx Configuration

Nginx config: `/etc/nginx/sites-available/justclothing`

To modify:
```bash
sudo nano /etc/nginx/sites-available/justclothing
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

## SSL/HTTPS

### Automatic (Let's Encrypt)

Already configured during deployment with auto-renewal.

```bash
# Check certificate status
sudo certbot certificates

# Renew manually (auto-renewal should handle this)
sudo certbot renew
```

### Manual Certificate

If needed:
```bash
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com
```

## Backups

### Database Backup

```bash
# Manual backup
sudo bash scripts/ops-utils.sh backup

# Automated backups (add to crontab)
0 2 * * * sudo bash /home/justclothing/justclothing/scripts/ops-utils.sh backup
```

### Database Restore

```bash
sudo bash scripts/ops-utils.sh restore
# Follow prompts to select backup file
```

### Application Files

```bash
# Backup application directory
sudo tar -czf /backups/app_backup_$(date +%Y%m%d).tar.gz /home/justclothing/justclothing/
```

## Scaling

### Increase Gunicorn Workers

Edit `/etc/supervisor/conf.d/gunicorn.conf`:
```ini
command=$APP_HOME/venv/bin/gunicorn \
    --workers 8 \    # Increase from 4 to 8
    ...
```

Restart: `sudo supervisorctl restart gunicorn`

### Increase Celery Concurrency

Edit `/etc/supervisor/conf.d/celery.conf`:
```ini
command=$APP_HOME/venv/bin/celery -A justclothing worker \
    --concurrency=8 \    # Increase from 4 to 8
    ...
```

Restart: `sudo supervisorctl restart celery`

## Troubleshooting

### Services won't start

```bash
# Check service status
sudo supervisorctl status

# View logs
sudo supervisorctl tail -f [service-name]

# Check system logs
sudo journalctl -xe
```

### Database connection errors

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
sudo -u postgres psql -d justclothing_db
```

### Nginx errors

```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# View error log
sudo tail -f /var/log/nginx/error.log
```

### Redis connection issues

```bash
# Check Redis is running
sudo systemctl status redis-server

# Test connection
redis-cli ping  # Should return PONG
```

## Maintenance

### Regular Tasks

- Monitor disk space: `df -h`
- Check service status: `sudo supervisorctl status`
- Review logs for errors
- Update OS packages: `sudo apt update && sudo apt upgrade`
- Backup database regularly

### Security Updates

```bash
# Apply security updates
sudo apt update
sudo apt upgrade

# Restart services if needed
sudo supervisorctl restart all
```

## Support & Documentation

- Django Docs: https://docs.djangoproject.com/
- DRF Docs: https://www.django-rest-framework.org/
- Gunicorn Docs: https://gunicorn.org/
- Celery Docs: https://docs.celeryproject.io/
- Nginx Docs: https://nginx.org/

## Common Issues & Solutions

### Issue: Port already in use

```bash
# Check what's using port 8000
sudo lsof -i :8000

# Kill process if needed
sudo kill -9 <PID>
```

### Issue: Static files not loading

```bash
# Recollect static files
cd /home/justclothing/justclothing
sudo -u justclothing ./venv/bin/python backend/manage.py collectstatic --noinput

# Restart nginx
sudo systemctl restart nginx
```

### Issue: Database migrations failed

```bash
# Check migration status
cd /home/justclothing/justclothing
sudo -u justclothing ./venv/bin/python backend/manage.py showmigrations

# Re-run migrations
sudo -u justclothing ./venv/bin/python backend/manage.py migrate --verbose
```

---

**Last Updated:** February 2026
**Deployment Type:** Native (Non-Docker)
**Python Version:** 3.x
**Django Version:** 4.2+
