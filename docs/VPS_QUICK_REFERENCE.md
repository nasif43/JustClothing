# VPS Deployment Quick Reference

## Pre-Deployment
```bash
# SSH into your VPS
ssh root@your_vps_ip

# Clone repository
cd /tmp
git clone <your-repo-url> JustClothing
cd JustClothing

# Make scripts executable
chmod +x scripts/deploy-vps.sh
chmod +x scripts/justclothing-deploy-util.sh
```

## Deploy in 3 Steps
```bash
# Step 1: Run deployment script
sudo bash scripts/deploy-vps.sh . your-domain.com admin@your-domain.com

# Step 2: Follow interactive prompts
# - Enter PostgreSQL password
# - Enter Django SECRET_KEY (or auto-generate)
# - Create superuser account

# Step 3: Verify installation
sudo /opt/justclothing/justclothing-deploy-util.sh health
```

## DNS Configuration
Point your domain to VPS IP:
```
A Record: your-domain.com → your_vps_ip
A Record: www.your-domain.com → your_vps_ip
```

## First Time Login
```
URL: https://your-domain.com/admin
Username: (superuser from setup)
Password: (password from setup)
```

## Common Management Commands

### Check Status
```bash
sudo /opt/justclothing/justclothing-deploy-util.sh status
sudo /opt/justclothing/justclothing-deploy-util.sh health
```

### View Logs
```bash
sudo /opt/justclothing/justclothing-deploy-util.sh logs-backend
sudo /opt/justclothing/justclothing-deploy-util.sh logs-celery
sudo /opt/justclothing/justclothing-deploy-util.sh logs-nginx
```

### Database Operations
```bash
# Backup database
sudo /opt/justclothing/justclothing-deploy-util.sh db-backup

# Restore database
sudo /opt/justclothing/justclothing-deploy-util.sh db-restore /path/to/backup.sql

# Access database shell
sudo /opt/justclothing/justclothing-deploy-util.sh db-shell
```

### Update Application
```bash
sudo /opt/justclothing/justclothing-deploy-util.sh update
```

### Restart Services
```bash
sudo /opt/justclothing/justclothing-deploy-util.sh restart
```

## Configuration Files

### Backend Environment
`/opt/justclothing/backend/.env`
- Email settings
- AWS S3 credentials
- Google OAuth credentials
- MinIO configuration

### Nginx Configuration
`/etc/nginx/sites-available/justclothing`
- SSL certificates
- Domain configuration
- Proxy settings

### Django Settings
`/opt/justclothing/backend/justclothing/settings.py`
- Installed apps
- Middleware
- Database settings

### Database Connection
```
Host: localhost
Port: 5432
Database: justclothing_db
User: justclothing_user
```

### Redis Connection
```
Host: localhost
Port: 6379
DB: 0
```

### MinIO Access
```
URL: http://your_vps_ip:9000
Console: http://your_vps_ip:9001
User: minioadmin
Password: minioadmin123
```

## Firewall Rules
```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Block MinIO from internet (optional)
# sudo ufw deny 9000/tcp
# sudo ufw deny 9001/tcp
```

## SSL Certificate
```bash
# Check certificate expiration
sudo certbot certificates

# Manual renewal
sudo certbot renew --verbose

# Auto-renewal is enabled via certbot.timer
```

## Performance Tuning

### Gunicorn Workers (default: 4)
Edit `/etc/systemd/system/gunicorn-justclothing.service`
- Change `--workers 4` to `--workers N`
- N = (2 × CPU cores) + 1

### Nginx Worker Processes
Edit `/etc/nginx/nginx.conf`
- Set `worker_processes auto;`

### PostgreSQL Tuning
Edit `/etc/postgresql/*/main/postgresql.conf`
- max_connections
- shared_buffers
- effective_cache_size

## Log Locations
```
Backend:   /var/log/justclothing/backend/
Celery:    /var/log/justclothing/celery/
Nginx:     /var/log/justclothing/nginx/
System:    journalctl -u gunicorn-justclothing -f
```

## Backup Strategy

### Automated Daily Backups
Already set up at: 2 AM UTC

### Manual Backup
```bash
sudo /opt/justclothing/justclothing-deploy-util.sh db-backup
```

### Backup Location
```
Directory: /opt/justclothing/backups/
Format: backup_YYYYMMDD_HHMMSS.sql
```

## Monitoring URLs

### Application
- Main: https://your-domain.com
- Admin: https://your-domain.com/admin
- API: https://your-domain.com/api

### Object Storage (MinIO)
- API: http://your_vps_ip:9000
- Console: http://your_vps_ip:9001

### Database Monitoring
```bash
# Connect to database
psql -h localhost -U justclothing_user -d justclothing_db

# Common queries
SELECT version();
SELECT pg_size_pretty(pg_database_size('justclothing_db'));
SELECT * FROM pg_stat_activity;
```

## Troubleshooting Checklist

- [ ] Services running: `status`
- [ ] Disk space available: `disk-usage`
- [ ] Database connected: `db-shell`
- [ ] SSL certificate valid: `ssl-status`
- [ ] No error logs: `errors`
- [ ] Performance acceptable: `performance`

## Contact Support

For issues, check:
1. Error logs: `/opt/justclothing/justclothing-deploy-util.sh errors`
2. Service status: `/opt/justclothing/justclothing-deploy-util.sh health`
3. System resources: `free -h` and `df -h`

## Documentation
- Full guide: `/opt/justclothing/docs/VPS_DEPLOYMENT_GUIDE.md`
- Deployment info: `/opt/justclothing/DEPLOYMENT_INFO.txt`
- Utility help: `sudo /opt/justclothing/justclothing-deploy-util.sh help`
