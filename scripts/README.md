# JustClothing VPS Deployment Scripts

This directory contains production-ready deployment scripts for running JustClothing on a VPS without Docker.

## 📋 Overview

The deployment solution includes:

- **deploy-vps.sh** - Full automated deployment script
- **justclothing-deploy-util.sh** - Daily management and operations utility
- **VPS_DEPLOYMENT_GUIDE.md** - Comprehensive deployment documentation
- **VPS_QUICK_REFERENCE.md** - Quick reference guide
- **env.production.template** - Environment configuration template

## 🚀 Quick Start

### 1. Prerequisites

- Ubuntu/Debian-based VPS (20.04 LTS or newer)
- Minimum 2GB RAM, 20GB disk space
- Root or sudo access
- Domain name with DNS control

### 2. Clone Repository
```bash
cd /tmp
git clone <your-repo-url> JustClothing
cd JustClothing
chmod +x scripts/deploy-vps.sh scripts/justclothing-deploy-util.sh
```

### 3. Run Deployment
```bash
sudo bash scripts/deploy-vps.sh . your-domain.com admin@your-domain.com
```

The script will:
- Install all system dependencies
- Configure PostgreSQL database
- Set up Redis cache
- Install MinIO object storage
- Build and configure React frontend
- Setup Nginx with SSL/TLS
- Configure Gunicorn + Celery workers
- Setup systemd services for automatic startup
- Configure logging and monitoring

### 4. Access Your App
```
Website: https://your-domain.com
Admin: https://your-domain.com/admin
API: https://your-domain.com/api
```

## 📁 Script Details

### deploy-vps.sh

**Full automated deployment script** - Takes your Docker Compose configuration and deploys everything on a bare VPS.

**Features:**
- System package installation
- Database setup with PostgreSQL
- Redis cache configuration
- MinIO object storage installation
- Python virtual environment creation
- Django database migrations
- React frontend building
- Nginx web server configuration
- SSL certificate setup with Let's Encrypt
- Systemd services for all components
- Comprehensive logging setup
- Firewall configuration

**Usage:**
```bash
sudo bash scripts/deploy-vps.sh [repo-path] [domain] [email]

Arguments:
  repo-path : Path to cloned repository (default: .)
  domain    : Your domain (default: justclothing.store)
  email     : Email for SSL certificate (default: admin@justclothing.store)

Example:
  sudo bash scripts/deploy-vps.sh . example.com admin@example.com
```

**What it does:**
1. Updates system packages
2. Creates application user (justclothing)
3. Installs all dependencies (Python, Node.js, PostgreSQL, Redis, Nginx)
4. Sets up and initializes PostgreSQL database
5. Configures Redis server
6. Installs MinIO for object storage
7. Copies application files to `/opt/justclothing`
8. Creates Python virtual environment and installs dependencies
9. Runs Django migrations
10. Builds React frontend with npm
11. Configures Nginx as reverse proxy
12. Sets up Let's Encrypt SSL certificate
13. Creates systemd services for:
    - Gunicorn (Django app server)
    - Celery worker (background jobs)
    - Celery Beat (task scheduler)
14. Configures logrotate and journalctl
15. Enables UFW firewall
16. Creates management utility
17. Performs health checks

**Post-deployment:**
- You'll find `/opt/justclothing/DEPLOYMENT_INFO.txt` with all configuration details
- Management script available at `/opt/justclothing/manage-deployment.sh` (legacy)
- Use `justclothing-deploy-util.sh` for ongoing management

### justclothing-deploy-util.sh

**Daily operations and management utility** - After deployment, use this for common tasks.

**Service Management:**
```bash
sudo justclothing-deploy-util.sh status      # Show all service status
sudo justclothing-deploy-util.sh start       # Start all services
sudo justclothing-deploy-util.sh stop        # Stop all services
sudo justclothing-deploy-util.sh restart     # Restart all services
```

**Logging:**
```bash
sudo justclothing-deploy-util.sh logs-backend   # Django/Gunicorn logs
sudo justclothing-deploy-util.sh logs-celery    # Celery worker logs
sudo justclothing-deploy-util.sh logs-nginx     # Nginx error logs
sudo justclothing-deploy-util.sh logs-access    # Nginx access logs
sudo justclothing-deploy-util.sh logs-all       # All service logs
```

**System Diagnostics:**
```bash
sudo justclothing-deploy-util.sh health        # Full health check
sudo justclothing-deploy-util.sh performance   # Performance metrics
sudo justclothing-deploy-util.sh errors        # Recent errors
```

**Database Management:**
```bash
sudo justclothing-deploy-util.sh db-shell      # PostgreSQL shell
sudo justclothing-deploy-util.sh db-backup     # Create backup
sudo justclothing-deploy-util.sh db-restore <file>  # Restore backup
sudo justclothing-deploy-util.sh db-size       # Database size
sudo justclothing-deploy-util.sh db-stats      # Table statistics
```

**Django Management:**
```bash
sudo justclothing-deploy-util.sh shell         # Django shell
sudo justclothing-deploy-util.sh createsuperuser  # Create admin user
sudo justclothing-deploy-util.sh migrate       # Run migrations
sudo justclothing-deploy-util.sh collectstatic # Collect static files
```

**Updates & Deployment:**
```bash
sudo justclothing-deploy-util.sh update        # Pull latest code and update
sudo justclothing-deploy-util.sh deploy        # Deploy changes
```

**SSL/HTTPS:**
```bash
sudo justclothing-deploy-util.sh ssl-status    # Check certificate
sudo justclothing-deploy-util.sh ssl-renew     # Renew certificate
sudo justclothing-deploy-util.sh ssl-test      # Test SSL config
```

**Maintenance:**
```bash
sudo justclothing-deploy-util.sh clean-logs    # Remove old logs
sudo justclothing-deploy-util.sh disk-usage    # Show disk usage
sudo justclothing-deploy-util.sh env-info      # Environment info
```

## 📚 Documentation

### VPS_DEPLOYMENT_GUIDE.md
Comprehensive guide covering:
- Pre-deployment checklist
- Step-by-step deployment
- Post-deployment configuration
- Service management
- Monitoring and maintenance
- Troubleshooting
- Security hardening
- Scaling considerations

### VPS_QUICK_REFERENCE.md
Quick lookup guide with:
- Essential commands
- Configuration file locations
- Connection details
- Troubleshooting checklist
- Common problems and solutions

### env.production.template
Template for environment variables with:
- All configuration options
- Detailed comments
- Example values
- Security recommendations
- Integration instructions for:
  - Email services
  - Payment providers
  - OAuth services
  - Analytics tools
  - AWS S3
  - MinIO

## 🔧 Configuration

### Environment Variables

Copy the template and customize:
```bash
cp backend/env.production.template backend/.env
sudo nano /opt/justclothing/backend/.env
```

Key settings:
- `SECRET_KEY` - Django secret (auto-generated)
- `DEBUG` - Set to False in production
- `ALLOWED_HOSTS` - Your domain
- `DB_PASSWORD` - Database password
- `REDIS_URL` - Redis connection
- `EMAIL_HOST_USER` - Email account for notifications
- `GOOGLE_OAUTH2_CLIENT_ID` - OAuth configuration
- `AWS_ACCESS_KEY_ID` - S3 or MinIO credentials

### Nginx Configuration

Main config file: `/etc/nginx/sites-available/justclothing`

Routes configured:
- `/` → React frontend
- `/api/` → Django REST API
- `/admin/` → Django admin panel
- `/static/` → Static files (CSS, JS)
- `/media/` → User uploads
- `/minio/` → Object storage proxy
- `/swagger/` → API documentation

### SSL/TLS Certificates

- **Location**: `/etc/letsencrypt/live/your-domain.com/`
- **Auto-renewal**: Enabled via certbot.timer
- **Renewal check**: `sudo certbot certificates`
- **Manual renewal**: `sudo certbot renew --verbose`

## 🔍 Monitoring Services

### Check All Services
```bash
sudo systemctl status gunicorn-justclothing
sudo systemctl status celery-justclothing
sudo systemctl status celery-beat-justclothing
sudo systemctl status nginx
sudo systemctl status postgresql
sudo systemctl status redis-server
```

### View Real-time Logs
```bash
sudo journalctl -u gunicorn-justclothing -f     # Django app
sudo journalctl -u celery-justclothing -f       # Background jobs
sudo journalctl -u nginx -f                     # Web server
```

### Performance Metrics
```bash
# CPU and memory
free -h
top

# Disk usage
df -h
du -sh /opt/justclothing/*

# Network
netstat -tuln | grep LISTEN
ss -tuln

# Database size
sudo -u postgres psql -d justclothing_db -c "SELECT pg_size_pretty(pg_database_size('justclothing_db'));"
```

## 📊 Backup and Recovery

### Automated Backups
- Daily at 2 AM UTC
- Kept for 30 days
- Location: `/opt/justclothing/backups/`

### Manual Backup
```bash
sudo /opt/justclothing/justclothing-deploy-util.sh db-backup
```

### Restore from Backup
```bash
sudo /opt/justclothing/justclothing-deploy-util.sh db-restore /path/to/backup.sql
```

## 🔐 Security Best Practices

1. **Keep secrets secure**
   - Never commit `.env` file to version control
   - Use strong, random passwords
   - Rotate credentials regularly

2. **Enable HTTPS**
   - Automatic via Let's Encrypt
   - HSTS headers enabled
   - SSL/TLS 1.2+ only

3. **Firewall configuration**
   - Only ports 22, 80, 443 open publicly
   - MinIO restricted to localhost
   - Rate limiting enabled on API

4. **Regular updates**
   - Keep system packages updated: `sudo apt update && sudo apt upgrade`
   - Update Python dependencies: `pip install --upgrade -r requirements.txt`
   - Monitor security advisories

5. **Monitoring**
   - Regular log review
   - Health checks enabled
   - Error tracking via logs

## 🐛 Troubleshooting

### Services not starting
```bash
sudo /opt/justclothing/justclothing-deploy-util.sh health
sudo /opt/justclothing/justclothing-deploy-util.sh errors
```

### Database connection issues
```bash
sudo -u postgres psql -d justclothing_db -c "SELECT 1;"
```

### Nginx not working
```bash
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

### Disk space issues
```bash
sudo /opt/justclothing/justclothing-deploy-util.sh disk-usage
sudo /opt/justclothing/justclothing-deploy-util.sh clean-logs
```

See **VPS_DEPLOYMENT_GUIDE.md** for comprehensive troubleshooting.

## 📞 Support

- **Logs**: Check `/var/log/justclothing/` for detailed logs
- **Status**: `sudo justclothing-deploy-util.sh health`
- **Documentation**: Read VPS_DEPLOYMENT_GUIDE.md
- **Commands**: `sudo justclothing-deploy-util.sh help`

## 📦 Directory Structure

```
/opt/justclothing/
├── backend/                    # Django application
│   ├── justclothing/          # Django project settings
│   ├── apps/                  # Django applications
│   ├── media/                 # User uploads
│   ├── staticfiles/           # Collected static files
│   ├── .env                   # Environment configuration
│   └── requirements.txt       # Python dependencies
├── frontend/                  # React application
│   ├── dist/                 # Built frontend (production)
│   ├── src/                  # React source code
│   └── package.json          # Node.js dependencies
├── venv/                      # Python virtual environment
├── backups/                   # Database backups
├── DEPLOYMENT_INFO.txt        # Deployment details
└── justclothing-deploy-util.sh # Management utility

/var/log/justclothing/
├── backend/                   # Django/Gunicorn logs
├── celery/                    # Celery worker logs
└── nginx/                     # Nginx logs

/etc/systemd/system/
├── gunicorn-justclothing.service      # Django app server
├── celery-justclothing.service        # Background jobs
└── celery-beat-justclothing.service   # Task scheduler

/etc/nginx/sites-available/
└── justclothing               # Nginx configuration
```

## 🎯 Next Steps After Deployment

1. **Access your site**
   - Main: https://your-domain.com
   - Admin: https://your-domain.com/admin

2. **Configure settings in Django Admin**
   - Add Site domain
   - Configure email settings
   - Set up payment providers
   - Configure external services

3. **Test functionality**
   - Create test products
   - Test checkout flow
   - Verify email notifications
   - Monitor background jobs

4. **Setup monitoring**
   - Enable uptime monitoring
   - Configure error tracking
   - Setup log aggregation
   - Setup alerts

5. **Optimize performance**
   - Monitor resources
   - Adjust Gunicorn workers
   - Configure caching
   - Enable CDN (optional)

## 📝 Notes

- The deployment script is idempotent - it can be run multiple times safely
- All configuration is stored in `.env` file in the backend directory
- Services automatically restart on reboot via systemd
- Logs are automatically rotated to prevent disk space issues
- SSL certificates auto-renew before expiration

## 🚫 Common Pitfalls

1. **Not setting ALLOWED_HOSTS** - API calls will fail with 400 Bad Request
2. **Not configuring email** - Password reset and notifications won't work
3. **Not backing up database** - Data loss risk
4. **Not monitoring logs** - Issues go unnoticed
5. **Not updating dependencies** - Security vulnerabilities

---

**Version**: 1.0.0  
**Last Updated**: February 27, 2026  
**Maintainer**: DevOps Team
