#!/bin/bash

# MinIO Quick Recovery Script
# Run this if MinIO setup failed

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    print_error "This script must be run with sudo"
    exit 1
fi

print_header "MinIO Recovery Script"

# Stop MinIO if running
print_warning "Stopping MinIO service..."
systemctl stop minio 2>/dev/null || true
sleep 1

# Create minio user if not exists
print_warning "Ensuring minio user exists..."
if ! id "minio" &>/dev/null; then
    useradd -r -s /bin/false minio
    print_success "Created minio system user"
else
    print_success "Minio user already exists"
fi

# Create directories
print_warning "Creating MinIO directories..."
mkdir -p /opt/minio/data
mkdir -p /opt/minio/config

# Set permissions
print_warning "Setting correct permissions..."
chown -R minio:minio /opt/minio
chmod 755 /opt/minio
chmod 755 /opt/minio/data

# Download MinIO binary
print_warning "Downloading MinIO binary..."
cd /opt/minio
rm -f minio  # Remove old/corrupted binary
if curl -L --progress-bar -o minio https://dl.min.io/server/minio/release/linux-amd64/minio; then
    print_success "Downloaded MinIO binary"
else
    print_error "Failed to download MinIO binary"
    exit 1
fi

chmod +x /opt/minio/minio
chown minio:minio /opt/minio/minio
print_success "Set binary permissions"

# Create environment file
print_warning "Creating environment file..."
cat > /etc/default/minio << 'EOF'
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123
MINIO_CONFIG_ENV_FILE=/opt/minio/config/minio.env
EOF

# Create systemd service
print_warning "Creating systemd service..."
cat > /etc/systemd/system/minio.service << 'EOF'
[Unit]
Description=MinIO Object Storage Server
Documentation=https://docs.min.io/docs/minio-quickstart-guide
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=minio
Group=minio
ProtectParentDirectories=yes
ProtectHome=yes
NoNewPrivileges=on
PrivateTmp=yes

WorkingDirectory=/opt/minio
EnvironmentFile=/etc/default/minio

Environment="MINIO_ROOT_USER=minioadmin"
Environment="MINIO_ROOT_PASSWORD=minioadmin123"

ExecStart=/opt/minio/minio server /opt/minio/data --console-address ":9001"

Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=minio

[Install]
WantedBy=multi-user.target
EOF

print_success "Created systemd service file"

# Reload and start
print_warning "Reloading systemd daemon..."
systemctl daemon-reload
sleep 1

print_warning "Starting MinIO service..."
if systemctl start minio; then
    sleep 2
    
    if systemctl is-active --quiet minio; then
        systemctl enable minio
        print_success "MinIO service started successfully!"
        
        echo ""
        print_header "MinIO Recovery Complete"
        
        echo -e "${GREEN}MinIO is now running!${NC}"
        echo ""
        echo "Access MinIO:"
        echo "  Console: http://$(hostname -I | awk '{print $1}'):9001"
        echo "  API: http://$(hostname -I | awk '{print $1}'):9000"
        echo ""
        echo "Credentials:"
        echo "  Username: minioadmin"
        echo "  Password: minioadmin123"
        echo ""
        
        # Check ports
        echo "Verifying ports are open:"
        if netstat -tulpn 2>/dev/null | grep -q 9000; then
            print_success "Port 9000 (API) is open"
        else
            print_error "Port 9000 (API) is not open"
        fi
        
        if netstat -tulpn 2>/dev/null | grep -q 9001; then
            print_success "Port 9001 (Console) is open"
        else
            print_error "Port 9001 (Console) is not open"
        fi
        
        exit 0
    else
        print_error "MinIO service failed to stay running"
        echo ""
        echo "Service status:"
        systemctl status minio --no-pager
        echo ""
        echo "Recent logs:"
        journalctl -u minio -n 30 --no-pager
        exit 1
    fi
else
    print_error "Failed to start MinIO service"
    echo ""
    echo "Service status:"
    systemctl status minio --no-pager
    echo ""
    echo "Recent logs:"
    journalctl -u minio -n 30 --no-pager
    exit 1
fi
