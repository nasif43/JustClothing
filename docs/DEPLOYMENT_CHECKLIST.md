# VPS Deployment Pre-Flight Checklist

Use this checklist before running the deployment script to ensure everything is ready.

## ✅ Server Requirements

- [ ] Ubuntu 20.04 LTS or newer
- [ ] Minimum 2GB RAM (4GB+ recommended)
- [ ] Minimum 20GB available disk space (50GB+ recommended)
- [ ] SSH root access or sudo privileges
- [ ] Public IP address assigned
- [ ] Internet connection at least 100 Mbps

**Verify with:**
```bash
lsb_release -a          # Check Ubuntu version
free -h                 # Check RAM
df -h                   # Check disk space
```

## ✅ Domain Setup

- [ ] Domain name registered
- [ ] DNS access available
- [ ] A record pointing to VPS IP
- [ ] Optional: WWW subdomain A record
- [ ] DNS changes propagated (may take 24 hours)

**Verify DNS with:**
```bash
nslookup your-domain.com
# or
dig your-domain.com
```

## ✅ Repository Preparation

- [ ] Application code committed to git repository
- [ ] Git repository is accessible from VPS
- [ ] SSH key configured for git access (if private repo)
- [ ] README and documentation updated
- [ ] `.env.example` contains all required variables

**Verify with:**
```bash
cd /tmp
git clone <your-repo-url> JustClothing
cd JustClothing
ls -la  # Check all files are present
```

## ✅ Application Code Review

- [ ] Django settings configured for production
- [ ] React frontend built and tested locally
- [ ] Database migrations are up to date
- [ ] Static files references are correct
- [ ] No hardcoded secrets in code
- [ ] All dependencies in requirements.txt
- [ ] Node.js dependencies in package.json

**Verify with:**
```bash
cd backend
cat justclothing/settings.py | grep DEBUG  # Should be configurable
cat requirements.txt | wc -l                # Should have many packages
```

## ✅ Environment Configuration

- [ ] Copy `env.example` to `env.production.template`
- [ ] Fill in all required variables
- [ ] Generate Django SECRET_KEY (save it somewhere safe)
- [ ] Create strong database password
- [ ] Prepare email credentials (Gmail app password, etc.)
- [ ] Prepare any OAuth credentials (Google, etc.)
- [ ] Optional: Prepare AWS S3 or payment provider credentials

**Generate SECRET_KEY with:**
```bash
python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

## ✅ DNS Configuration

Before running deployment, point your domain to the VPS:

- [ ] Add A record: `your-domain.com` → `your_vps_ip`
- [ ] Add A record: `www.your-domain.com` → `your_vps_ip`
- [ ] Optional: Add A record: `api.your-domain.com` → `your_vps_ip`

**Verify DNS is resolving:**
```bash
nslookup your-domain.com
# Should return your_vps_ip
```

## ✅ VPS Preparation

- [ ] SSH into VPS and update packages
- [ ] No conflicting services on ports 80, 443, 8000, 5432, 6379
- [ ] Firewall disabled or SSH access allowed (UFW setup will be handled)
- [ ] Adequate system entropy for SSL certificate generation

**Verify with:**
```bash
ssh root@your_vps_ip
sudo apt update
sudo apt upgrade -y
lsof -i :80   # Port 80
lsof -i :443  # Port 443
```

## ✅ Deployment Scripts

- [ ] `deploy-vps.sh` is executable
- [ ] `justclothing-deploy-util.sh` is executable
- [ ] Scripts have been reviewed
- [ ] Backup of original scripts created

**Prepare with:**
```bash
chmod +x scripts/deploy-vps.sh
chmod +x scripts/justclothing-deploy-util.sh
```

## ✅ Backup Strategy

- [ ] Local backup of entire repository
- [ ] Local backup of `.env` file
- [ ] Cloud storage configured for backups (optional)
- [ ] Backup retention policy decided

**Create backup:**
```bash
tar -czf JustClothing-backup-$(date +%Y%m%d).tar.gz /path/to/repo
```

## ✅ Credentials and Secrets

- [ ] Django SECRET_KEY generated and saved securely
- [ ] Database password created and saved securely
- [ ] Email credentials available and tested
- [ ] OAuth credentials (if needed) prepared
- [ ] AWS/MinIO credentials (if needed) prepared
- [ ] Payment provider credentials (if needed) prepared
- [ ] Stripe/PayPal test mode configured (if applicable)

**Store safely with:**
```bash
# Option 1: Password manager
# Option 2: Encrypted file locally
# Option 3: AWS Secrets Manager
# Option 4: HashiCorp Vault
```

## ✅ Optional Services

If using external services, prepare credentials:

- [ ] AWS S3 (Alternative to MinIO)
  - [ ] Access Key ID
  - [ ] Secret Access Key
  - [ ] Bucket name
  - [ ] Region

- [ ] Email Service (Gmail/SendGrid/AWS SES)
  - [ ] Account email
  - [ ] App password or API key
  - [ ] SMTP server details

- [ ] Payment Processing (Stripe/PayPal)
  - [ ] API keys
  - [ ] Test credentials
  - [ ] Webhook URLs

- [ ] OAuth (Google, Facebook, etc.)
  - [ ] Client ID
  - [ ] Client Secret
  - [ ] Redirect URIs

- [ ] Analytics (Google Analytics)
  - [ ] Tracking ID
  - [ ] GTM Container ID

## ✅ Testing Checklist

- [ ] Application runs locally without errors
- [ ] All database migrations apply successfully
- [ ] Frontend builds without warnings
- [ ] Admin interface loads correctly
- [ ] API endpoints respond correctly
- [ ] Static files are served correctly
- [ ] Email sending works
- [ ] External API integrations tested

## ✅ Documentation Review

- [ ] README.md is up to date
- [ ] Deployment guide reviewed
- [ ] Quick reference guide available
- [ ] Environment template reviewed
- [ ] Architecture documented
- [ ] Emergency procedures documented

## ✅ Communication

If working with a team:

- [ ] Team informed of deployment
- [ ] Maintenance window scheduled
- [ ] Support contact available during deployment
- [ ] Post-deployment review meeting scheduled
- [ ] Rollback plan communicated

## ✅ Pre-Deployment Day

24 hours before deployment:

- [ ] Verify DNS is resolving correctly
- [ ] Test SSH access to VPS
- [ ] Verify all credentials are accessible
- [ ] Create fresh backup of code and data
- [ ] Review deployment script one more time
- [ ] Confirm domain and email addresses
- [ ] Verify email notifications will work

## ✅ Deployment Day Preparation

1 hour before deployment:

- [ ] Clear schedule for 1-2 hours
- [ ] Have all credentials ready
- [ ] Have VPS access ready
- [ ] Have backup copies available
- [ ] Have support contact info ready
- [ ] Notify stakeholders
- [ ] Test SSH access one more time

## ✅ Deployment Execution

When ready to deploy:

```bash
# 1. SSH into VPS
ssh root@your_vps_ip

# 2. Clone repository (if not already done)
cd /tmp
git clone <your-repo-url> JustClothing
cd JustClothing

# 3. Make scripts executable
chmod +x scripts/deploy-vps.sh
chmod +x scripts/justclothing-deploy-util.sh

# 4. Run deployment with all parameters
sudo bash scripts/deploy-vps.sh . your-domain.com admin@your-domain.com

# 5. Follow interactive prompts carefully
# - Enter PostgreSQL password
# - Enter Django SECRET_KEY (or let it auto-generate)
# - Create Django superuser
```

## ✅ Post-Deployment Verification

After deployment completes:

- [ ] Check service status: `sudo systemctl status gunicorn-justclothing`
- [ ] Access website: `https://your-domain.com`
- [ ] Access admin: `https://your-domain.com/admin`
- [ ] Check logs for errors: `sudo journalctl -u gunicorn-justclothing -f`
- [ ] Verify SSL certificate: `https://your-domain.com` (green lock icon)
- [ ] Test API: `curl -s https://your-domain.com/api/products/ | head -20`
- [ ] Create test product in admin
- [ ] Test email notification (if configured)
- [ ] Verify database backup created
- [ ] Check all services running: `sudo systemctl status`

**Helpful commands:**
```bash
sudo /opt/justclothing/justclothing-deploy-util.sh health
sudo /opt/justclothing/justclothing-deploy-util.sh status
sudo /opt/justclothing/justclothing-deploy-util.sh errors
```

## ✅ Post-Deployment Configuration

First 24 hours after deployment:

- [ ] Update Django admin site name
- [ ] Configure email settings in admin
- [ ] Test email sending
- [ ] Create test data
- [ ] Test all major workflows
- [ ] Monitor logs for errors
- [ ] Monitor system resources
- [ ] Notify stakeholders of successful deployment
- [ ] Schedule regular backups
- [ ] Setup uptime monitoring
- [ ] Document any customizations made

## ✅ Ongoing Maintenance Checklist

Daily:
- [ ] Monitor error logs
- [ ] Check service status

Weekly:
- [ ] Review application performance
- [ ] Check disk space usage
- [ ] Verify backups completed

Monthly:
- [ ] Update system packages
- [ ] Review security logs
- [ ] Test backup restoration
- [ ] Update dependencies

Quarterly:
- [ ] Security audit
- [ ] Performance optimization
- [ ] Review and update documentation

## ❌ Common Issues to Watch For

- [ ] DNS not resolving - RESOLUTION: Wait 24 hours and verify with `nslookup`
- [ ] Port already in use - RESOLUTION: Check with `lsof -i :port`
- [ ] SSL certificate not issued - RESOLUTION: Verify DNS is resolving and accessible
- [ ] Database connection failed - RESOLUTION: Check `.env` file has correct credentials
- [ ] Permission denied errors - RESOLUTION: Check file ownership and permissions
- [ ] Out of memory - RESOLUTION: Increase swap or upgrade server
- [ ] Disk full - RESOLUTION: Check log sizes and database backups

## 📞 Support Resources

If issues occur:

1. **Check logs**: `sudo /opt/justclothing/justclothing-deploy-util.sh errors`
2. **Check health**: `sudo /opt/justclothing/justclothing-deploy-util.sh health`
3. **Read guide**: `/opt/justclothing/docs/VPS_DEPLOYMENT_GUIDE.md`
4. **Manual inspection**: SSH into VPS and check service status
5. **Rollback**: Restore from backup if necessary

## 📋 Sign-Off

- [ ] All checklist items completed
- [ ] Team lead approval obtained
- [ ] Ready to proceed with deployment

**Deployment Date**: ________________  
**Deployed By**: ________________  
**Verified By**: ________________  

---

**Notes & Issues Encountered:**

```
_________________________________________________________________

_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```

---

**Post-Deployment Review Meeting Date**: ________________
