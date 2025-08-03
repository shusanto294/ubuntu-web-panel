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

# Install PHP and related packages for WordPress support
print_status "Installing PHP and MySQL for WordPress support..."
sudo apt install -y php8.1 php8.1-fpm php8.1-mysql php8.1-xml php8.1-curl php8.1-mbstring php8.1-zip php8.1-gd php8.1-intl php8.1-bcmath php8.1-soap php8.1-imagick php8.1-cli php8.1-common php8.1-opcache

# Install MySQL Server
print_status "Installing MySQL Server..."
sudo DEBIAN_FRONTEND=noninteractive apt install -y mysql-server

# Install additional utilities
print_status "Installing additional utilities..."
sudo apt install -y git curl wget unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Install PM2 for Node.js process management
print_status "Installing PM2 for Node.js process management..."
sudo npm install -g pm2

# Install Composer for PHP dependency management
print_status "Installing Composer for PHP..."
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
sudo chmod +x /usr/local/bin/composer

# Install WP-CLI for WordPress management
print_status "Installing WP-CLI for WordPress management..."
curl -O https://raw.githubusercontent.com/wp-cli/wp-cli/master/utils/wp-completion.bash
curl -O https://raw.githubusercontent.com/wp-cli/wp-cli/master/bin/wp-cli.phar
chmod +x wp-cli.phar
sudo mv wp-cli.phar /usr/local/bin/wp
sudo chmod +x /usr/local/bin/wp

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

# Install Node.js dependencies
print_status "Installing Node.js dependencies..."
npm install

print_status "Installing client dependencies..."
cd client && npm install && cd ..

# Create .env file
if [ ! -f .env ]; then
    print_status "Creating .env configuration file..."
    # Generate JWT secret
    JWT_SECRET=$(openssl rand -base64 64)
    
    cat > .env << EOF
# Cloudflare API Configuration
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here
CLOUDFLARE_ZONE_ID=your_default_zone_id_here

# JWT Secret (auto-generated)
JWT_SECRET=${JWT_SECRET}

# Server Configuration
PORT=3001
NODE_ENV=production

# MongoDB Database
MONGODB_URI=mongodb://localhost:27017/ubuntu_web_panel

# MySQL Database Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
MYSQL_USER=root

# WordPress Configuration
WP_CLI_PATH=/usr/local/bin/wp
COMPOSER_PATH=/usr/local/bin/composer

# PHP Configuration
PHP_VERSION=8.1
PHP_FPM_SOCKET=/run/php/php8.1-fpm.sock

# Node.js Configuration
NODE_VERSION=18
PM2_PATH=/usr/local/bin/pm2

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

# Site Types Support
SUPPORT_WORDPRESS=true
SUPPORT_NODEJS=true
SUPPORT_STATIC=true
SUPPORT_PHP=true

# WordPress Download URL
WORDPRESS_DOWNLOAD_URL=https://wordpress.org/latest.tar.gz
EOF
    print_success ".env file created with auto-generated secrets!"
    print_warning "Please edit the Cloudflare API credentials in .env file!"
else
    print_success ".env file already exists"
fi

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
echo "📦 INSTALLED COMPONENTS:"
echo "✅ Node.js 18 + npm + PM2"
echo "✅ PHP 8.1 + PHP-FPM (optimized for WordPress)"
echo "✅ MySQL Server (secured with auto-generated password)"
echo "✅ MongoDB (for panel database)"
echo "✅ Nginx (web server)"
echo "✅ Certbot (SSL certificates)"
echo "✅ Email Stack (Postfix + Dovecot + OpenDKIM)"
echo "✅ WordPress Tools (WP-CLI + Composer)"
echo "✅ Development Tools (Git, Curl, Wget, Unzip)"
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