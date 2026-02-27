# JustClothing VPS Architecture

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              INTERNET / DNS                                  │
│                       your-domain.com (80/443)                              │
└──────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│                         UFW FIREWALL                                         │
│  Allow: 22 (SSH), 80 (HTTP), 443 (HTTPS), Deny: All Others                 │
└──────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│                         NGINX (Port 80/443)                                  │
│                    SSL/TLS Termination + Routing                             │
├──────────────────────────────────────────────────────────────────────────────┤
│  • Handles HTTPS (Let's Encrypt)                                             │
│  • Proxies /api/ → Gunicorn                                                  │
│  • Serves static files directly                                              │
│  • Proxies /admin/ → Gunicorn                                                │
│  • Serves React frontend (SPA)                                               │
│  • Proxies /minio/ → MinIO                                                   │
└──────────────────────────────────────────────────────────────────────────────┘
         │                    │                    │                  │
         ↓                    ↓                    ↓                  ↓
    ┌────────────┐    ┌──────────────┐    ┌────────────┐    ┌────────────────┐
    │  Frontend  │    │  Backend API │    │   Admin    │    │ Static/Media   │
    │ (React)   │    │  (Django)    │    │ (Django)   │    │   Files        │
    │           │    │              │    │            │    │                │
    │ /index.html│   │ /api/*       │    │ /admin/    │    │ /static/*      │
    │ /assets/* │    │              │    │            │    │ /media/*       │
    └────────────┘    └──────────────┘    └────────────┘    └────────────────┘
         │                    ↓                    ↓
         │            ┌────────────────────────────┴──────────┐
         │            ↓                                       ↓
         │     ┌──────────────────┐            ┌──────────────────────────┐
         │     │ GUNICORN (8000)  │            │ MINIO (9000 / 9001)      │
         │     │ Django App Server│            │ Object Storage            │
         │     ├──────────────────┤            ├──────────────────────────┤
         │     │ 4 worker threads │            │ S3-compatible API        │
         │     │ Port: 8000       │            │ Console: 9001            │
         │     │ Serves:          │            │ Storage: /opt/minio/data │
         │     │  - Django ORM    │            │ Buckets:                 │
         │     │  - REST API      │            │  - justclothing-media    │
         │     │  - Admin Panel   │            │  - (for files/images)    │
         │     └──────────────────┘            └──────────────────────────┘
         │            ↓↑                                    
         │            ↓↓                       
         │     ┌──────────────────────────────────────────┐
         │     │  CELERY WORKERS & BEAT                   │
         │     ├──────────────────────────────────────────┤
         │     │ • Background Job Processing               │
         │     │ • Scheduled Tasks (Beat)                 │
         │     │ • Email Sending                          │
         │     │ • Image Processing                       │
         │     │ • Order Processing                       │
         │     │ • Notifications                          │
         │     └──────────────────────────────────────────┘
         │            ↓↑↑↑↑↑↑↑
         │            ↓↓↓↓↓↓↓
         │     ┌─────────────────────────────────────────────┐
         │     │          SHARED SERVICES                     │
         │     ├─────────────────────────────────────────────┤
         │     │                                              │
         │     │  ┌──────────────┐      ┌──────────────────┐ │
         │     │  │   REDIS      │      │  POSTGRESQL      │ │
         │     │  │  (6379)      │      │  (5432)          │ │
         │     │  ├──────────────┤      ├──────────────────┤ │
         │     │  │ • Cache      │      │ • Main Database  │ │
         │     │  │ • Sessions   │      │ • Users          │ │
         │     │  │ • Message    │      │ • Products       │ │
         │     │  │   Broker    │      │ • Orders         │ │
         │     │  │ • Task Queue │      │ • Transactions   │ │
         │     │  │ • Rate Limit │      │ • Relationships  │ │
         │     │  │   Storage   │      │                  │ │
         │     │  └──────────────┘      └──────────────────┘ │
         │     │                                              │
         │     └─────────────────────────────────────────────┘
         │
         └─→ React Browser
             • Vue, React components
             • Tailwind CSS styling
             • Real-time updates via WebSocket (optional)
             • REST API calls to /api/


┌─────────────────────────────────────────────────────────────────────────────┐
│                        LOGGING & MONITORING                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  /var/log/justclothing/                                                     │
│  ├── backend/                          → gunicorn-justclothing             │
│  │   ├── access.log                    → All API requests                  │
│  │   ├── error.log                     → Application errors                │
│  │   └── (auto-rotated daily)                                              │
│  │                                                                          │
│  ├── celery/                           → celery-justclothing               │
│  │   ├── worker.log                    → Background job logs               │
│  │   ├── beat.log                      → Task scheduler logs               │
│  │   └── (auto-rotated daily)                                              │
│  │                                                                          │
│  └── nginx/                            → nginx                             │
│      ├── access.log                    → All HTTP requests                 │
│      ├── error.log                     → Web server errors                 │
│      └── (auto-rotated daily)                                              │
│                                                                              │
│  System Logs: journalctl -u SERVICE_NAME                                   │
│                                                                              │
│  Database Logs: sudo journalctl -u postgresql                              │
│  Redis Logs: sudo journalctl -u redis-server                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                      SYSTEMD SERVICES (Auto-start)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  gunicorn-justclothing                                                      │
│  ├─ Runs: /opt/justclothing/venv/bin/gunicorn justclothing.wsgi            │
│  ├─ Port: 8000                                                             │
│  ├─ Workers: 4                                                             │
│  └─ Restart: always                                                        │
│                                                                              │
│  celery-justclothing                                                        │
│  ├─ Runs: /opt/justclothing/venv/bin/celery -A justclothing worker        │
│  ├─ Concurrency: 4                                                         │
│  └─ Restart: always                                                        │
│                                                                              │
│  celery-beat-justclothing                                                   │
│  ├─ Runs: /opt/justclothing/venv/bin/celery -A justclothing beat          │
│  ├─ Scheduler: DatabaseScheduler                                           │
│  └─ Restart: always                                                        │
│                                                                              │
│  nginx                                                                       │
│  ├─ Config: /etc/nginx/sites-available/justclothing                       │
│  ├─ Ports: 80 (HTTP), 443 (HTTPS)                                         │
│  └─ Restart: always                                                        │
│                                                                              │
│  postgresql                                                                 │
│  ├─ Data: /var/lib/postgresql/14/main                                     │
│  ├─ Port: 5432                                                             │
│  └─ Restart: always                                                        │
│                                                                              │
│  redis-server                                                               │
│  ├─ Config: /etc/redis/redis.conf                                         │
│  ├─ Port: 6379                                                             │
│  └─ Restart: always                                                        │
│                                                                              │
│  minio                                                                       │
│  ├─ Binary: /opt/minio/minio                                              │
│  ├─ Data: /opt/minio/data                                                 │
│  ├─ Ports: 9000 (API), 9001 (Console)                                     │
│  └─ Restart: always                                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA FLOW EXAMPLE                                    │
│                    User Creates a Product                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. Browser sends request                                                   │
│     POST /api/products/                                                     │
│                           ↓                                                  │
│                                                                              │
│  2. Nginx receives request, proxies to Gunicorn (8000)                     │
│                           ↓                                                  │
│                                                                              │
│  3. Django application:                                                     │
│     - Validates data                                                        │
│     - Processes image upload                                                │
│     - Creates database record in PostgreSQL                                │
│     - Saves image to MinIO                                                  │
│     - Sends confirmation response                                           │
│                           ↓                                                  │
│                                                                              │
│  4. Celery task queued:                                                     │
│     - Generate thumbnails (background)                                      │
│     - Send notifications (background)                                       │
│     - Update search index (background)                                      │
│                           ↓                                                  │
│                                                                              │
│  5. Celery Worker processes async tasks                                     │
│     - Retrieves messages from Redis queue                                   │
│     - Executes tasks                                                        │
│     - Updates PostgreSQL                                                    │
│     - Caches results in Redis                                               │
│                           ↓                                                  │
│                                                                              │
│  6. User receives response immediately                                      │
│     - Product created                                                       │
│     - Images uploading in background                                        │
│     - Notifications sent asynchronously                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                      BACKUP & RECOVERY                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Automated Daily Backup (2 AM UTC)                                          │
│  ├─ Location: /opt/justclothing/backups/                                   │
│  ├─ Format: backup_YYYYMMDD_HHMMSS.sql                                     │
│  ├─ Method: pg_dump -Fc (compressed)                                       │
│  ├─ Retention: 30 days automatic cleanup                                    │
│  └─ Size: ~50-500MB depending on data                                      │
│                                                                              │
│  Manual Backup Command:                                                     │
│  $ sudo justclothing-deploy-util.sh db-backup                              │
│                                                                              │
│  Restore Command:                                                           │
│  $ sudo justclothing-deploy-util.sh db-restore backup_20260227_020000.sql │
│                                                                              │
│  Verify Backup:                                                             │
│  $ ls -lh /opt/justclothing/backups/                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                         SSL/TLS SETUP                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Let's Encrypt Certificates                                                │
│  ├─ Issuer: Let's Encrypt (Free)                                           │
│  ├─ Location: /etc/letsencrypt/live/your-domain.com/                      │
│  ├─ Validity: 90 days                                                      │
│  ├─ Auto-renewal: Via certbot.timer (runs daily)                           │
│  ├─ Renewal grace period: 30 days before expiry                            │
│  └─ Status: `sudo certbot certificates`                                    │
│                                                                              │
│  Certificate Files:                                                         │
│  ├─ fullchain.pem     → Certificate + intermediates                        │
│  ├─ privkey.pem       → Private key                                        │
│  ├─ cert.pem          → Certificate only                                   │
│  └─ chain.pem         → Intermediate certs                                 │
│                                                                              │
│  Nginx Configuration                                                        │
│  ├─ ssl_certificate: fullchain.pem                                         │
│  ├─ ssl_certificate_key: privkey.pem                                       │
│  ├─ ssl_protocols: TLSv1.2 TLSv1.3                                        │
│  ├─ ssl_ciphers: HIGH:!aNULL:!MD5                                         │
│  └─ HSTS headers: Enabled                                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                       FILE STRUCTURE ON VPS                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  /opt/justclothing/                                                         │
│  ├── backend/                                                              │
│  │   ├── justclothing/              (Django project settings)              │
│  │   ├── apps/                      (Django applications)                  │
│  │   ├── media/                     (Uploaded files)                       │
│  │   ├── staticfiles/               (Collected static assets)              │
│  │   ├── .env                       (Configuration - DO NOT COMMIT)        │
│  │   ├── manage.py                  (Django management)                    │
│  │   └── requirements.txt           (Python dependencies)                  │
│  │                                                                          │
│  ├── frontend/                                                             │
│  │   ├── dist/                      (Built React app for production)       │
│  │   ├── src/                       (React source code)                    │
│  │   ├── node_modules/              (Node.js dependencies)                 │
│  │   ├── package.json               (Node.js config)                       │
│  │   └── vite.config.js             (Build configuration)                  │
│  │                                                                          │
│  ├── venv/                          (Python virtual environment)           │
│  │   ├── bin/                       (Python executables)                   │
│  │   ├── lib/                       (Python packages)                      │
│  │   └── pyvenv.cfg                 (Configuration)                        │
│  │                                                                          │
│  ├── backups/                       (Database backups)                     │
│  │   └── backup_20260227_020000.sql (Compressed database dump)             │
│  │                                                                          │
│  ├── justclothing-deploy-util.sh    (Management utility)                   │
│  ├── DEPLOYMENT_INFO.txt            (Deployment details)                   │
│  └── manage-deployment.sh           (Legacy management script)             │
│                                                                              │
│  /etc/nginx/                                                                │
│  ├── sites-available/justclothing   (Nginx config)                        │
│  └── sites-enabled/justclothing → sites-available/justclothing            │
│                                                                              │
│  /etc/systemd/system/                                                       │
│  ├── gunicorn-justclothing.service                                         │
│  ├── celery-justclothing.service                                           │
│  └── celery-beat-justclothing.service                                      │
│                                                                              │
│  /var/log/justclothing/                                                     │
│  ├── backend/                       (Django logs)                          │
│  ├── celery/                        (Celery logs)                          │
│  └── nginx/                         (Web server logs)                      │
│                                                                              │
│  /var/lib/postgresql/               (PostgreSQL data)                      │
│  /opt/minio/                        (MinIO data)                           │
│  /etc/letsencrypt/                  (SSL certificates)                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

```

## Request Flow Diagram

```
                      Client Browser
                           │
                           │ HTTPS Request
                           ↓
                  ┌─────────────────────┐
                  │   Internet / DNS    │
                  │  your-domain.com    │
                  └─────────────────────┘
                           │
                           ↓
                   ┌─────────────────┐
                   │  VPS Firewall   │
                   │   (UFW)         │
                   └─────────────────┘
                           │
                    ┌──────┴──────┐
                    │             │
                    ↓             ↓
              [Port 80]      [Port 443]
              (Redirect)     (HTTPS)
                    │             │
                    └──────┬──────┘
                           ↓
                    ┌─────────────────┐
                    │  NGINX Server   │
                    │  (SSL/TLS)      │
                    │  Port 80, 443   │
                    └─────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
    Static Files       API Routes        Admin Routes
        │                  │                  │
        ↓                  ↓                  ↓
  [React Build]   [Gunicorn:8000]    [Gunicorn:8000]
  /dist/*         /api/*             /admin/*
  Cache: 365d     Timeout: 60s       Protected
        │                  │                  │
        └──────────────────┼──────────────────┘
                           ↓
                 ┌──────────────────────┐
                 │  Django Backend      │
                 │  (Gunicorn 8000)     │
                 │  4 Workers           │
                 └──────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ↓                  ↓                  ↓
   [PostgreSQL]      [Redis Cache]     [MinIO]
   [Database]        [Sessions/Queue]  [Storage]
    │ Products        │ 60s TTL         │ Images
    │ Orders          │ Celery tasks    │ Files
    │ Users           │ Rate limit      │ Videos
    └─────────────────┴─────────────────┘
                           ↓
                    [Celery Workers]
                    Async Processing
                    │ Email
                    │ Thumbnails
                    │ Reports


RESPONSE PATH (Reverse):
[Celery]
   ↓
[PostgreSQL/Redis/MinIO]
   ↓
[Django/Gunicorn]
   ↓
[Nginx]
   ↓
[HTTPS]
   ↓
[Client Browser]
```

## Performance & Scalability

```
CURRENT SETUP:
  • Gunicorn: 4 workers (handles ~100 concurrent users)
  • Celery: 4 workers (processes ~1000 tasks/hour)
  • Redis: Single instance (handles cache + queues)
  • PostgreSQL: Single instance (handles ~1000 connections)
  • Storage: MinIO (handles unlimited files on disk)

TO SCALE UP:

  1000+ Users:
    ├─ Increase Gunicorn workers: 8-16
    ├─ Add Celery workers: 8-16
    └─ Increase PostgreSQL connections

  10,000+ Users:
    ├─ Add HAProxy load balancer
    ├─ Multiple Gunicorn instances
    ├─ Redis Sentinel for HA
    ├─ PostgreSQL replication
    └─ Separate database server

  100,000+ Users:
    ├─ Kubernetes cluster
    ├─ RDS (managed database)
    ├─ ElastiCache (managed Redis)
    ├─ S3 (managed storage)
    └─ CloudFront CDN
```

---

This architecture diagram shows:
- How requests flow from internet → app
- Where each service lives
- How databases are connected
- Logging architecture
- Service interdependencies
- Data persistence
- SSL/TLS handling
- Backup strategy
