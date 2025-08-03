#!/bin/bash

set -e  # Exit on any error

echo "🚀 Ubuntu Web Panel - Quick Setup"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_warning "Running as root is not recommended for security reasons"
    read -p "Do you want to continue as root? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Update system packages
print_status "Updating system packages..."
sudo apt update

# Install Node.js 18
if ! command -v node &> /dev/null; then
    print_status "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    print_success "Node.js already installed: $(node --version)"
fi

# Install system dependencies in one go
print_status "Installing system dependencies (Nginx, Certbot, MongoDB, Email servers)..."
sudo apt install -y nginx certbot python3-certbot-nginx postfix dovecot-core dovecot-imapd dovecot-pop3d opendkim opendkim-tools

# Install MongoDB
if ! command -v mongod &> /dev/null; then
    print_status "Installing MongoDB..."
    wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    sudo apt update
    sudo apt install -y mongodb-org
    sudo systemctl start mongod
    sudo systemctl enable mongod
else
    print_success "MongoDB already installed"
fi

# Create mail user
if ! id "vmail" &>/dev/null; then
    print_status "Creating virtual mail user..."
    sudo groupadd -g 5000 vmail
    sudo useradd -g vmail -u 5000 vmail -d /var/mail -s /bin/false
    sudo mkdir -p /var/mail
    sudo chown -R vmail:vmail /var/mail
    sudo chmod -R 755 /var/mail
else
    print_success "Virtual mail user already exists"
fi

# Install Node.js dependencies
print_status "Installing Node.js dependencies..."
npm install

print_status "Installing client dependencies..."
cd client && npm install && cd ..

# Create .env file
if [ ! -f .env ]; then
    print_status "Creating .env configuration file..."
    cat > .env << 'EOF'
# Cloudflare API Configuration
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here
CLOUDFLARE_ZONE_ID=your_default_zone_id_here

# JWT Secret (generate a secure random string)
JWT_SECRET=your_jwt_secret_here

# Server Configuration
PORT=3001
NODE_ENV=production

# MongoDB Database
MONGODB_URI=mongodb://localhost:27017/ubuntu_web_panel

# Email Server Configuration
MAIL_SERVER=mail.yourdomain.com
MAIL_PORT=587
MAIL_SECURITY=tls
MAIL_AUTH_USER=admin@yourdomain.com
MAIL_AUTH_PASSWORD=your_mail_password

# System Paths
NGINX_SITES_AVAILABLE=/etc/nginx/sites-available
NGINX_SITES_ENABLED=/etc/nginx/sites-enabled
WEB_ROOT=/var/www
POSTFIX_CONFIG_PATH=/etc/postfix
DOVECOT_CONFIG_PATH=/etc/dovecot
MAIL_HOME=/var/mail
EOF
    print_warning "Please edit the .env file with your actual configuration!"
else
    print_success ".env file already exists"
fi

# Create necessary directories
print_status "Creating directories..."
mkdir -p database
sudo mkdir -p /var/www
sudo chown -R $USER:www-data /var/www
sudo chmod -R 755 /var/www

# Setup sudo permissions
print_status "Configuring sudo permissions for web panel..."
echo "$USER ALL=(ALL) NOPASSWD: /usr/sbin/nginx, /bin/systemctl reload nginx, /usr/bin/certbot, /bin/systemctl restart nginx, /usr/sbin/postfix, /bin/systemctl reload postfix, /bin/systemctl reload dovecot, /bin/systemctl reload opendkim, /usr/bin/postmap, /usr/bin/doveadm, /usr/bin/opendkim-genkey" | sudo tee /etc/sudoers.d/webpanel

# Build the application
print_status "Building client application..."
cd client && npm run build && cd ..

print_success "Setup completed successfully!"
echo ""
echo "🎉 Ubuntu Web Panel is now installed!"
echo ""
echo "📝 NEXT STEPS:"
echo "1. Edit the .env file: nano .env"
echo "2. Add your Cloudflare API token and zone ID"
echo "3. Start the panel: ./start.sh"
echo "4. Access: http://your-server-ip:3001"
echo "5. Login: admin / password (CHANGE IMMEDIATELY!)"
echo ""
echo "📧 Email Server Setup:"
echo "- All email components are installed"
echo "- Configure domains through the web panel"
echo "- Add DNS records (MX, SPF, DKIM, DMARC)"
echo ""
echo "🔒 Security Notes:"
echo "- Change default admin password immediately"
echo "- Configure firewall (ufw enable)"
echo "- Consider using PM2 for process management"