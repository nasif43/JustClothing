# JustClothing Deployment Setup Guide

## 🚨 Critical Configuration Differences Between Local and VPS

### **VPS Production Setup (What You Fixed Yesterday):**

1. **Nginx Proxy Manager**: You're using `jc21/nginx-proxy-manager:latest` for HTTPS/SSL
   - Handles SSL certificates automatically
   - Runs on ports 80, 81, 443
   - This is your HTTPS solution!

2. **Production Environment File**: `.env` with production settings
3. **Docker Compose**: Complete with nginx service

### **Missing Locally:**

1. **Environment File**: Create `.env` for local development
2. **Production Docker Compose**: Was missing nginx service (now fixed)

## 🔧 Setup Instructions

### **1. Create Local Environment File**

Create `.env` in project root with:

```bash
# Copy from VPS .env but change these for local development:
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0
SECRET_KEY=your-local-development-secret-key
```

### **2. Create Production Environment File**

Create `.env.prod` with your VPS settings:

```bash
# Django Settings
SECRET_KEY=^%xjg^cd9b+rh%$-t!w=!@0qy&2oahu2uppu*t9t1myuc#r!lr
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,justclothing.store,128.199.77.255,admin.justclothing.store

# Database Configuration
DB_NAME=justclothing_db
DB_USER=justclothing_user
DB_PASSWORD=justclothing_password
DB_HOST=localhost
DB_PORT=5432

# Redis Configuration
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0

# Email Configuration (configure as needed)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# AWS S3 Configuration (if using)
USE_S3=False
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_STORAGE_BUCKET_NAME=your-bucket-name
AWS_S3_REGION_NAME=us-east-1
```

## 🚀 Deployment Workflow

### **Local Development:**
```bash
# Create your .env file first
cp .env.example .env  # Edit with local settings

# Start development environment
./manage.sh dev-start
```

### **Production Deployment:**
```bash
# On VPS - your working setup
./manage.sh prod-start
```

## 🔐 HTTPS Setup (Already Working on VPS)

Your VPS uses **Nginx Proxy Manager** for SSL/HTTPS:
- Container: `jc21/nginx-proxy-manager:latest`
- Ports: 80, 81, 443
- Admin interface: `http://your-vps-ip:81`

**Don't change this setup** - it's working!

## 🐛 Issues to Fix on VPS

Your Celery containers are restarting. Check logs:
```bash
docker logs justclothing-celery-1
docker logs justclothing-celery-beat-1
```

## ⚠️ Important Notes

1. **Never commit `.env` or `.env.prod`** - they contain secrets
2. **Your HTTPS setup works through Nginx Proxy Manager** - don't change nginx.conf for SSL
3. **The nginx service in docker-compose is for internal routing only**
4. **Always test locally before deploying to VPS**