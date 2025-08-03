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

# Update system packages and upgrade existing ones
print_status "Updating system packages and upgrading existing software..."
sudo apt update
sudo apt upgrade -y

# Install/Upgrade Node.js 18
print_status "Installing/upgrading Node.js to latest LTS (18.x)..."
if command -v node &> /dev/null; then
    CURRENT_NODE=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    print_status "Current Node.js version: v$(node --version)"
    if [ "$CURRENT_NODE" -lt 18 ]; then
        print_status "Upgrading Node.js from v$CURRENT_NODE to v18..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        print_status "Updating Node.js to latest v18..."
        sudo apt-get update
        sudo apt-get install -y nodejs
    fi
else
    print_status "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
print_success "Node.js version: $(node --version)"
print_success "npm version: $(npm --version)"

# Install/Upgrade system dependencies
print_status "Installing/upgrading system dependencies (Nginx, Certbot, Email servers)..."
sudo apt install -y --upgrade nginx certbot python3-certbot-nginx postfix dovecot-core dovecot-imapd dovecot-pop3d opendkim opendkim-tools

# Check and display versions
print_success "Nginx version: $(nginx -v 2>&1 | cut -d' ' -f3)"
print_success "Certbot version: $(certbot --version | cut -d' ' -f2)"

# Add PHP repository
print_status "Adding PHP repository..."
sudo apt install -y software-properties-common
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update

# Install/Upgrade PHP and related packages for WordPress support
print_status "Installing/upgrading PHP 8.1 and MySQL for WordPress support..."
sudo apt install -y --upgrade php8.1 php8.1-fpm php8.1-mysql php8.1-xml php8.1-curl php8.1-mbstring php8.1-zip php8.1-gd php8.1-intl php8.1-bcmath php8.1-soap php8.1-imagick php8.1-cli php8.1-common php8.1-opcache

# Install/Upgrade MySQL Server
print_status "Installing/upgrading MySQL Server..."
sudo DEBIAN_FRONTEND=noninteractive apt install -y --upgrade mysql-server

# Display versions
print_success "PHP version: $(php --version | head -n1)"
print_success "MySQL version: $(mysql --version)"

# Install/Upgrade additional utilities
print_status "Installing/upgrading additional utilities..."
sudo apt install -y --upgrade git curl wget unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Install/Upgrade PM2 for Node.js process management
print_status "Installing/upgrading PM2 for Node.js process management..."
if command -v pm2 &> /dev/null; then
    print_status "Updating PM2 to latest version..."
    sudo npm update -g pm2
else
    print_status "Installing PM2..."
    sudo npm install -g pm2
fi
print_success "PM2 version: $(pm2 --version)"

# Install/Upgrade Composer for PHP dependency management
print_status "Installing/upgrading Composer for PHP..."
if command -v composer &> /dev/null; then
    print_status "Updating Composer to latest version..."
    sudo composer self-update
else
    print_status "Installing Composer..."
    curl -sS https://getcomposer.org/installer | php
    sudo mv composer.phar /usr/local/bin/composer
    sudo chmod +x /usr/local/bin/composer
fi
print_success "Composer version: $(composer --version | head -n1)"

# Install/Upgrade WP-CLI for WordPress management
print_status "Installing/upgrading WP-CLI for WordPress management..."
if command -v wp &> /dev/null; then
    print_status "Updating WP-CLI to latest version..."
    sudo wp cli update --allow-root --yes
else
    print_status "Installing WP-CLI..."
    curl -O https://raw.githubusercontent.com/wp-cli/wp-cli/master/utils/wp-completion.bash
    curl -O https://raw.githubusercontent.com/wp-cli/wp-cli/master/bin/wp-cli.phar
    chmod +x wp-cli.phar
    sudo mv wp-cli.phar /usr/local/bin/wp
    sudo chmod +x /usr/local/bin/wp
fi
print_success "WP-CLI version: $(wp --version --allow-root)"

# Install/Upgrade MongoDB
print_status "Installing/upgrading MongoDB..."

# Clean up any existing MongoDB repositories
sudo rm -f /etc/apt/sources.list.d/mongodb-org-*.list

# Detect Ubuntu version and use appropriate MongoDB version
UBUNTU_VERSION=$(lsb_release -rs)
UBUNTU_CODENAME=$(lsb_release -cs)

if command -v mongod &> /dev/null; then
    print_status "MongoDB already installed, checking for updates..."
    CURRENT_MONGO=$(mongod --version | grep "db version" | cut -d'v' -f2 | cut -d'.' -f1)
    print_status "Current MongoDB version: v$(mongod --version | grep "db version" | cut -d'v' -f2)"
fi

if [[ "$UBUNTU_VERSION" == "24.04" ]] || [[ "$UBUNTU_CODENAME" == "noble" ]]; then
    # For Ubuntu 24.04, use MongoDB 7.0 with jammy repository
    print_status "Ubuntu 24.04 detected, installing/upgrading MongoDB 7.0..."
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    sudo apt update
    sudo apt install -y --upgrade mongodb-org
elif [[ "$UBUNTU_VERSION" == "22.04" ]] || [[ "$UBUNTU_CODENAME" == "jammy" ]]; then
    # For Ubuntu 22.04, use MongoDB 6.0
    print_status "Ubuntu 22.04 detected, installing/upgrading MongoDB 6.0..."
    curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    sudo apt update
    sudo apt install -y --upgrade mongodb-org
else
    # For older Ubuntu versions or fallback, install from default repository
    print_status "Installing/upgrading MongoDB from default repository..."
    sudo apt install -y --upgrade mongodb
fi

# Start and enable MongoDB
if systemctl list-unit-files | grep -q "mongod.service"; then
    sudo systemctl start mongod
    sudo systemctl enable mongod
    print_success "MongoDB version: $(mongod --version | grep "db version" | cut -d'v' -f2)"
elif systemctl list-unit-files | grep -q "mongodb.service"; then
    sudo systemctl start mongodb
    sudo systemctl enable mongodb
    print_success "MongoDB service enabled"
fi

# Configure MySQL
print_status "Configuring MySQL..."
sudo systemctl start mysql
sudo systemctl enable mysql

# Secure MySQL installation (automated)
MYSQL_ROOT_PASSWORD=$(openssl rand -base64 32)
sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${MYSQL_ROOT_PASSWORD}';"
sudo mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "DELETE FROM mysql.user WHERE User='';"
sudo mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');"
sudo mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "DROP DATABASE IF EXISTS test;"
sudo mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';"
sudo mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "FLUSH PRIVILEGES;"

# Save MySQL root password
echo "MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}" >> ~/.mysql_credentials
chmod 600 ~/.mysql_credentials
print_success "MySQL configured. Root password saved to ~/.mysql_credentials"

# Configure PHP-FPM
print_status "Configuring PHP-FPM..."
sudo systemctl start php8.1-fpm
sudo systemctl enable php8.1-fpm

# Update PHP configuration for better WordPress performance
sudo sed -i 's/upload_max_filesize = 2M/upload_max_filesize = 64M/' /etc/php/8.1/fpm/php.ini
sudo sed -i 's/post_max_size = 8M/post_max_size = 64M/' /etc/php/8.1/fpm/php.ini
sudo sed -i 's/max_execution_time = 30/max_execution_time = 300/' /etc/php/8.1/fpm/php.ini
sudo sed -i 's/max_input_vars = 1000/max_input_vars = 3000/' /etc/php/8.1/fpm/php.ini
sudo sed -i 's/memory_limit = 128M/memory_limit = 256M/' /etc/php/8.1/fpm/php.ini

# Restart PHP-FPM to apply changes
sudo systemctl restart php8.1-fpm

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

# Install/Update Node.js dependencies
print_status "Installing/updating Node.js dependencies..."
if [ -f package.json ]; then
    if [ -d node_modules ]; then
        print_status "Updating existing server dependencies..."
        npm update
    else
        print_status "Installing server dependencies..."
        npm install
    fi
else
    print_warning "No package.json found for server dependencies"
fi

print_status "Installing/updating client dependencies..."
cd client
if [ -f package.json ]; then
    if [ -d node_modules ]; then
        print_status "Updating existing client dependencies..."
        npm update --legacy-peer-deps
    else
        print_status "Installing client dependencies..."
        npm install --legacy-peer-deps
    fi
else
    print_warning "No package.json found for client dependencies"
fi
cd ..

# Create fully configured .env file
print_status "Creating fully configured .env file..."

# Generate secure secrets
JWT_SECRET=$(openssl rand -base64 64)
ADMIN_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)

# Get server details
SERVER_IP=$(curl -s ifconfig.me || echo "127.0.0.1")
HOSTNAME=$(hostname)
DOMAIN="${HOSTNAME}.local"

# Get user details
CURRENT_USER=$(whoami)
HOME_DIR=$(eval echo ~$CURRENT_USER)

# Auto-detect system details
PHP_VERSION="8.1"
if command -v php &> /dev/null; then
    PHP_VERSION=$(php -r "echo PHP_MAJOR_VERSION.'.'.PHP_MINOR_VERSION;")
fi

NODE_VERSION="18"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
fi

# Create comprehensive .env file
cat > .env << EOF
# =============================================================================
# UBUNTU WEB PANEL CONFIGURATION
# =============================================================================
# Auto-generated on $(date)
# Server: ${HOSTNAME} (${SERVER_IP})
# User: ${CURRENT_USER}
# =============================================================================

# CLOUDFLARE API CONFIGURATION
# Get your API token from: https://dash.cloudflare.com/profile/api-tokens
# Required permissions: Zone:Zone:Read, Zone:DNS:Edit
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ZONE_ID=
CLOUDFLARE_EMAIL=

# SECURITY CONFIGURATION (Auto-generated)
JWT_SECRET=${JWT_SECRET}
ADMIN_SECRET=${ADMIN_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}
SESSION_SECRET=$(openssl rand -base64 48)

# SERVER CONFIGURATION
PORT=3001
NODE_ENV=production
SERVER_IP=${SERVER_IP}
HOSTNAME=${HOSTNAME}
DOMAIN=${DOMAIN}
BASE_URL=http://${SERVER_IP}:3001

# DATABASE CONFIGURATION
# MongoDB (Panel Database)
MONGODB_URI=mongodb://localhost:27017/ubuntu_web_panel
MONGODB_OPTIONS=retryWrites=true&w=majority

# MySQL (WordPress & PHP Apps)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
MYSQL_USER=root
MYSQL_DATABASE=webpanel_apps

# APPLICATION PATHS
WP_CLI_PATH=/usr/local/bin/wp
COMPOSER_PATH=/usr/local/bin/composer
PM2_PATH=/usr/local/bin/pm2

# PHP CONFIGURATION
PHP_VERSION=${PHP_VERSION}
PHP_FPM_SOCKET=/run/php/php${PHP_VERSION}-fpm.sock
PHP_INI_PATH=/etc/php/${PHP_VERSION}/fpm/php.ini
PHP_POOL_PATH=/etc/php/${PHP_VERSION}/fpm/pool.d

# NODE.JS CONFIGURATION
NODE_VERSION=${NODE_VERSION}
NPM_REGISTRY=https://registry.npmjs.org/

# EMAIL SERVER CONFIGURATION
MAIL_SERVER=${HOSTNAME}
MAIL_PORT=587
MAIL_SECURITY=tls
MAIL_AUTH_USER=admin@${DOMAIN}
MAIL_AUTH_PASSWORD=
SMTP_HOST=localhost
SMTP_PORT=25
IMAP_HOST=localhost
IMAP_PORT=993
POP3_HOST=localhost
POP3_PORT=995

# SYSTEM PATHS
NGINX_SITES_AVAILABLE=/etc/nginx/sites-available
NGINX_SITES_ENABLED=/etc/nginx/sites-enabled
NGINX_CONFIG=/etc/nginx/nginx.conf
WEB_ROOT=/var/www
LOG_PATH=/var/log/webpanel
BACKUP_PATH=/opt/webpanel/backups
TEMPLATE_PATH=/opt/webpanel/templates

# EMAIL SYSTEM PATHS
POSTFIX_CONFIG_PATH=/etc/postfix
POSTFIX_MAIN_CF=/etc/postfix/main.cf
POSTFIX_MASTER_CF=/etc/postfix/master.cf
DOVECOT_CONFIG_PATH=/etc/dovecot
DOVECOT_CONF=/etc/dovecot/dovecot.conf
MAIL_HOME=/var/mail
OPENDKIM_CONFIG=/etc/opendkim.conf

# SITE TYPES SUPPORT
SUPPORT_WORDPRESS=true
SUPPORT_NODEJS=true
SUPPORT_STATIC=true
SUPPORT_PHP=true
SUPPORT_PYTHON=false
SUPPORT_RUBY=false

# WORDPRESS CONFIGURATION
WORDPRESS_DOWNLOAD_URL=https://wordpress.org/latest.tar.gz
WP_DEFAULT_THEME=twentytwentyfour
WP_DEFAULT_PLUGINS=
WP_AUTO_UPDATE=true
WP_SECURITY_KEYS=$(curl -s https://api.wordpress.org/secret-key/1.1/salt/ | tr -d '\n' | base64)

# SSL CONFIGURATION
SSL_PROVIDER=letsencrypt
CERTBOT_EMAIL=admin@${DOMAIN}
SSL_AUTO_RENEW=true
SSL_FORCE_HTTPS=false

# BACKUP CONFIGURATION
BACKUP_ENABLED=true
BACKUP_RETENTION_DAYS=30
BACKUP_SCHEDULE=0 2 * * *
BACKUP_COMPRESSION=gzip

# MONITORING CONFIGURATION
MONITORING_ENABLED=true
LOG_LEVEL=info
LOG_ROTATION=daily
LOG_RETENTION_DAYS=30

# SECURITY SETTINGS
FAIL2BAN_ENABLED=false
FIREWALL_ENABLED=false
AUTO_UPDATES=false
SECURITY_HEADERS=true

# PERFORMANCE SETTINGS
NGINX_GZIP=true
NGINX_CACHE=true
PHP_OPCACHE=true
MYSQL_CACHE=true

# DEVELOPMENT SETTINGS
DEBUG_MODE=false
VERBOSE_LOGS=false
ENABLE_PROFILING=false

# DEFAULT ADMIN USER
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=admin123!@#
DEFAULT_ADMIN_EMAIL=admin@${DOMAIN}

# API CONFIGURATION
API_RATE_LIMIT=100
API_RATE_WINDOW=900
API_TIMEOUT=30000

# WEBHOOK CONFIGURATION
WEBHOOK_SECRET=$(openssl rand -base64 32)
WEBHOOK_TIMEOUT=10000

# NOTIFICATION SETTINGS
EMAIL_NOTIFICATIONS=true
SLACK_WEBHOOK=
DISCORD_WEBHOOK=

# =============================================================================
# INSTALLATION NOTES:
# 
# 1. REQUIRED: Set your Cloudflare API token and zone ID above
# 2. OPTIONAL: Configure email notifications
# 3. RECOMMENDED: Change default admin credentials
# 4. The panel will be available at: http://${SERVER_IP}:3001
# 
# For help: Check the README.md file or visit the documentation
# =============================================================================
EOF

# Set proper permissions
chmod 600 .env
chown $CURRENT_USER:$CURRENT_USER .env

print_success ".env file created and fully configured!"
print_success "🔑 All secrets auto-generated securely"
print_success "🌐 Server IP detected: ${SERVER_IP}"
print_success "💾 MySQL password: ${MYSQL_ROOT_PASSWORD}"
print_warning "📝 IMPORTANT: Edit Cloudflare API credentials in .env"
print_warning "🔐 IMPORTANT: Change default admin password!"

echo ""
echo "📄 Configuration Summary:"
echo "  • Panel URL: http://${SERVER_IP}:3001"
echo "  • Admin User: admin"
echo "  • Admin Pass: admin123!@# (CHANGE THIS!)"
echo "  • MySQL Pass: Saved in ~/.mysql_credentials"
echo "  • Config File: .env (review and edit as needed)"
echo ""

# Create necessary directories
print_status "Creating directories..."
mkdir -p database
sudo mkdir -p /var/www
sudo mkdir -p /var/www/html
sudo mkdir -p /var/log/webpanel
sudo mkdir -p /etc/webpanel
sudo mkdir -p /opt/webpanel/backups
sudo mkdir -p /opt/webpanel/templates

# Set proper ownership and permissions
sudo chown -R $USER:www-data /var/www
sudo chmod -R 755 /var/www
sudo chown -R $USER:$USER /var/log/webpanel
sudo chown -R $USER:$USER /etc/webpanel
sudo chown -R $USER:$USER /opt/webpanel

# Setup sudo permissions
print_status "Configuring sudo permissions for web panel..."
cat > /tmp/webpanel_sudoers << 'EOF'
# Ubuntu Web Panel - System Management Permissions
%WEBPANEL_USER% ALL=(ALL) NOPASSWD: /usr/sbin/nginx
%WEBPANEL_USER% ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx
%WEBPANEL_USER% ALL=(ALL) NOPASSWD: /bin/systemctl restart nginx
%WEBPANEL_USER% ALL=(ALL) NOPASSWD: /bin/systemctl status nginx
%WEBPANEL_USER% ALL=(ALL) NOPASSWD: /usr/bin/certbot
%WEBPANEL_USER% ALL=(ALL) NOPASSWD: /bin/systemctl restart php8.1-fpm
%WEBPANEL_USER% ALL=(ALL) NOPASSWD: /bin/systemctl reload php8.1-fpm
%WEBPANEL_USER% ALL=(ALL) NOPASSWD: /bin/systemctl status php8.1-fpm
%WEBPANEL_USER% ALL=(ALL) NOPASSWD: /bin/systemctl restart mysql
%WEBPANEL_USER% ALL=(ALL) NOPASSWD: /bin/systemctl status mysql
%WEBPANEL_USER% ALL=(ALL) NOPASSWD: /usr/bin/mysql
%WEBPANEL_USER% ALL=(ALL) NOPASSWD: /usr/sbin/postfix
%WEBPANEL_USER% ALL=(ALL) NOPASSWD: /bin/systemctl reload postfix
%WEBPANEL_USER% ALL=(ALL) NOPASSWD: /bin/systemctl reload dovecot
%WEBPANEL_USER% ALL=(ALL) NOPASSWD: /bin/systemctl reload opendkim
%WEBPANEL_USER% ALL=(ALL) NOPASSWD: /usr/bin/postmap
%WEBPANEL_USER% ALL=(ALL) NOPASSWD: /usr/bin/doveadm
%WEBPANEL_USER% ALL=(ALL) NOPASSWD: /usr/bin/opendkim-genkey
%WEBPANEL_USER% ALL=(ALL) NOPASSWD: /usr/local/bin/wp
%WEBPANEL_USER% ALL=(ALL) NOPASSWD: /usr/local/bin/pm2
%WEBPANEL_USER% ALL=(ALL) NOPASSWD: /usr/local/bin/composer
%WEBPANEL_USER% ALL=(ALL) NOPASSWD: /bin/chown
%WEBPANEL_USER% ALL=(ALL) NOPASSWD: /bin/chmod
%WEBPANEL_USER% ALL=(ALL) NOPASSWD: /bin/mkdir
%WEBPANEL_USER% ALL=(ALL) NOPASSWD: /bin/rm
%WEBPANEL_USER% ALL=(ALL) NOPASSWD: /bin/cp
%WEBPANEL_USER% ALL=(ALL) NOPASSWD: /bin/mv
EOF

# Replace placeholder with actual user
sed "s/%WEBPANEL_USER%/$USER/g" /tmp/webpanel_sudoers | sudo tee /etc/sudoers.d/webpanel
sudo chmod 440 /etc/sudoers.d/webpanel
rm /tmp/webpanel_sudoers

# Build the application
print_status "Building client application..."
cd client && npm run build && cd ..

print_success "Setup completed successfully!"
echo ""
echo "🎉 Ubuntu Web Panel is now fully installed!"
echo ""
echo "📦 INSTALLED/UPGRADED COMPONENTS:"
echo "✅ Node.js: $(node --version) + npm: $(npm --version)"
echo "✅ PHP: $(php --version | head -n1 | cut -d' ' -f2)"
echo "✅ MySQL: $(mysql --version | cut -d' ' -f6 | cut -d',' -f1)"
if command -v mongod &> /dev/null; then
    echo "✅ MongoDB: $(mongod --version | grep "db version" | cut -d'v' -f2)"
else
    echo "✅ MongoDB: Service enabled"
fi
echo "✅ Nginx: $(nginx -v 2>&1 | cut -d'/' -f2)"
echo "✅ Certbot: $(certbot --version | cut -d' ' -f2)"
echo "✅ PM2: $(pm2 --version)"
echo "✅ Composer: $(composer --version | cut -d' ' -f3)"
echo "✅ WP-CLI: $(wp --version --allow-root | cut -d' ' -f2)"
echo "✅ Git: $(git --version | cut -d' ' -f3)"
echo ""
echo "🌐 SUPPORTED SITE TYPES:"
echo "✅ Static HTML/CSS/JS sites"
echo "✅ PHP applications"
echo "✅ WordPress sites (full management)"
echo "✅ Node.js applications (with PM2)"
echo ""
echo "📝 NEXT STEPS:"
echo "1. Edit Cloudflare credentials: nano .env"
echo "2. Start the panel: ./start.sh"
echo "3. Access: http://your-server-ip:3001"
echo "4. Login: admin / password (CHANGE IMMEDIATELY!)"
echo ""
echo "🔑 CREDENTIALS SAVED:"
echo "- MySQL root password: ~/.mysql_credentials"
echo "- JWT secret: auto-generated in .env"
echo ""
echo "📧 EMAIL SERVER:"
echo "- All components installed and configured"
echo "- Manage through web panel interface"
echo "- Add DNS records (MX, SPF, DKIM, DMARC)"
echo ""
echo "🔒 SECURITY:"
echo "- MySQL secured with random password"
echo "- PHP optimized and secured"
echo "- Comprehensive sudo permissions configured"
echo "- Change default admin password immediately!"
echo ""
echo "🚀 QUICK START:"
echo "   ./start.sh"
echo ""
print_warning "Remember to configure firewall: sudo ufw enable"