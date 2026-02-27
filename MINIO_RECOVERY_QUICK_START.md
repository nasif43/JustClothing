# MinIO Failed - Quick Recovery Steps

## What Happened

The MinIO service failed to start during the deployment. This is usually due to:
- User permission issues
- Missing system user
- Binary download problems
- Service configuration issues

**Good news:** This is fixable and doesn't stop the deployment!

---

## Quick Recovery (3 steps)

### Step 1: Run Recovery Script

```bash
sudo bash /root/JustClothing/scripts/recover-minio.sh
```

This script will:
- Create the minio user if missing
- Fix all permissions
- Re-download the MinIO binary
- Recreate the systemd service
- Start and enable MinIO

### Step 2: Verify MinIO is Running

```bash
sudo systemctl status minio
```

Should show: **Active (running)**

### Step 3: Test MinIO

```bash
# Test API
curl http://localhost:9000/minio/health/live

# Test Console
curl http://localhost:9001/
```

---

## If Recovery Script Works

✅ MinIO is now running! Continue with the deployment:

```bash
# Continue from where it failed
# The deployment script should have stopped at Step 6

# You can:
# 1. Run the full deployment again (it will skip completed steps)
# 2. Or manually continue from Step 7
```

---

## If Recovery Script Doesn't Work

Check the troubleshooting guide:

```bash
# Read detailed troubleshooting
cat /root/JustClothing/docs/MINIO_TROUBLESHOOTING.md

# Or diagnose manually:
sudo systemctl status minio
sudo journalctl -u minio -f
sudo ls -la /opt/minio/
```

---

## Alternative: Continue Without MinIO

If you just want to continue the deployment without MinIO for now:

```bash
# Disable MinIO
sudo systemctl disable minio
sudo systemctl stop minio

# Continue deploying Django, Nginx, etc
# You can set up MinIO later
```

---

## MinIO is Optional!

Your app can work without MinIO using:
- Local file storage (`/media/` directory)
- AWS S3 (configure in `.env`)
- Set up MinIO later when you have time

---

## Files to Reference

- **Recovery Script:** `scripts/recover-minio.sh`
- **Detailed Guide:** `docs/MINIO_TROUBLESHOOTING.md`
- **Updated Deploy Script:** `scripts/deploy-vps.sh` (now has better error handling)
- **Management Tool:** `sudo justclothing-deploy-util.sh help`

---

## Next Steps

1. ✅ Run recovery script
2. ✅ Verify MinIO is running
3. ✅ Continue deployment (re-run `deploy-vps.sh` or manually continue)
4. ✅ Test your application

---

**Need help?**
- Check: `docs/MINIO_TROUBLESHOOTING.md`
- Diagnose: `sudo bash scripts/troubleshoot.sh`
- View logs: `sudo journalctl -u minio -f`
