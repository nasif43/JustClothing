# MinIO Troubleshooting Guide

## If MinIO Service Failed to Start

### Immediate Actions

```bash
# 1. Check service status
sudo systemctl status minio

# 2. View detailed error logs
sudo journalctl -u minio -n 50 -f

# 3. Check if port 9000 is available
sudo lsof -i :9000
sudo lsof -i :9001

# 4. Check if minio user exists
id minio

# 5. Check file permissions
ls -la /opt/minio/
ls -la /opt/minio/minio
```

### Common Issues and Solutions

#### Issue 1: "User minio does not exist"
**Solution:**
```bash
sudo useradd -r -s /bin/false minio
sudo chown -R minio:minio /opt/minio
sudo systemctl restart minio
```

#### Issue 2: "Permission denied" on minio binary
**Solution:**
```bash
sudo chown minio:minio /opt/minio/minio
sudo chmod +x /opt/minio/minio
sudo systemctl restart minio
```

#### Issue 3: "Address already in use"
**Solution:**
```bash
# Check what's using port 9000
sudo netstat -tulpn | grep 9000

# Kill the process if needed
sudo kill -9 <PID>

# Restart MinIO
sudo systemctl restart minio
```

#### Issue 4: "Failed to download MinIO binary"
**Solution:**
```bash
# Manual download
cd /opt/minio
sudo wget https://dl.min.io/server/minio/release/linux-amd64/minio
sudo chmod +x minio
sudo chown minio:minio minio

# Or use direct download link
sudo curl -L -o minio https://dl.min.io/server/minio/release/linux-amd64/minio

# Restart service
sudo systemctl restart minio
```

#### Issue 5: Service keeps restarting (CrashLoop)
**Solution:**
```bash
# Check permissions on data directory
sudo chown -R minio:minio /opt/minio/data
sudo chmod 755 /opt/minio/data

# Check systemd service file
sudo systemctl cat minio | head -30

# Restart
sudo systemctl restart minio
```

### Step-by-Step Recovery

If MinIO still won't start after the script, try this recovery process:

```bash
# 1. Stop the service
sudo systemctl stop minio

# 2. Verify minio user
id minio
# If not found, create it:
sudo useradd -r -s /bin/false minio

# 3. Fix permissions on all minio files
sudo chown -R minio:minio /opt/minio
sudo chmod 755 /opt/minio
sudo chmod 755 /opt/minio/data

# 4. Check if binary is executable
sudo ls -la /opt/minio/minio
# Should show: -rwxr-xr-x

# 5. Download fresh binary if needed
cd /opt/minio
sudo rm -f minio
sudo curl -L -o minio https://dl.min.io/server/minio/release/linux-amd64/minio
sudo chmod +x minio
sudo chown minio:minio minio

# 6. Recreate systemd service
sudo cat > /etc/systemd/system/minio.service << 'EOF'
[Unit]
Description=MinIO Object Storage Server
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=minio
Group=minio
WorkingDirectory=/opt/minio

Environment="MINIO_ROOT_USER=minioadmin"
Environment="MINIO_ROOT_PASSWORD=minioadmin123"

ExecStart=/opt/minio/minio server /opt/minio/data --console-address ":9001"

Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 7. Reload and start
sudo systemctl daemon-reload
sudo systemctl start minio
sudo systemctl enable minio

# 8. Verify
sudo systemctl status minio
sudo journalctl -u minio -f
```

### Verify MinIO is Running

```bash
# Check service status
sudo systemctl status minio

# Check if listening on ports
sudo netstat -tulpn | grep minio
# Should show: :::9000 and :::9001

# Test API
curl -i http://localhost:9000/minio/health/live

# Test console
curl -i http://localhost:9001/

# Check logs
sudo journalctl -u minio -n 20
```

### Access MinIO After Fix

- **Console:** http://your-ip:9001
- **API:** http://your-ip:9000
- **Username:** minioadmin
- **Password:** minioadmin123

### Alternative: Disable MinIO for Now

If you just want to continue the deployment without MinIO:

```bash
# Disable MinIO service
sudo systemctl disable minio
sudo systemctl stop minio

# Continue with rest of deployment manually, or re-run deploy script
# The script should skip MinIO setup if it fails

# You can always set up MinIO later
sudo bash /opt/justclothing/justclothing-deploy-util.sh help
```

### Get More Help

```bash
# View detailed MinIO logs
sudo journalctl -u minio -n 100 --no-pager

# Watch logs in real time
sudo journalctl -u minio -f

# Check system logs
sudo dmesg | tail -20

# Check disk space
df -h

# Check memory
free -h

# Check if SELinux is blocking (if applicable)
sudo getenforce
```

### If All Else Fails

MinIO is optional - the app can work with local file storage or S3. If you can't get MinIO working:

1. Disable MinIO in the systemd service
2. Configure Django to use local file storage
3. Update `.env` file: `USE_S3=False`
4. Use local `/media/` directory for uploads
5. Set up MinIO later when you have time

### Report the Issue

When asking for help, provide:

```bash
# 1. Service status
sudo systemctl status minio

# 2. Full error log
sudo journalctl -u minio | tail -100

# 3. File permissions
ls -la /opt/minio/

# 4. System info
uname -a
df -h
free -h

# 5. Network info
netstat -tulpn | grep minio
```
