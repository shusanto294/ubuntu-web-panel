#!/bin/bash

# Ensure script is executable
chmod +x "$0" 2>/dev/null || true

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
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

echo -e "${BLUE}🚀 Ubuntu Web Panel - Starting...${NC}"
echo ""

# Check if .env exists, if not create it
if [ ! -f .env ]; then
    print_warning ".env file not found! Creating basic .env file..."
    
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
    
    # Create basic .env file
    cat > .env << EOF
# Ubuntu Web Panel Configuration
JWT_SECRET=${JWT_SECRET}
ADMIN_SECRET=${ADMIN_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}
SESSION_SECRET=$(openssl rand -base64 48)

# Server Configuration
PORT=3001
NODE_ENV=production
SERVER_IP=${SERVER_IP}
HOSTNAME=${HOSTNAME}
DOMAIN=${DOMAIN}
BASE_URL=http://${SERVER_IP}:3001

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/ubuntu_web_panel
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_ROOT_PASSWORD=password
MYSQL_USER=root
MYSQL_DATABASE=webpanel_apps

# Cloudflare Configuration (configure later)
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ZONE_ID=
CLOUDFLARE_EMAIL=

# Default Admin User
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=admin123!@#
DEFAULT_ADMIN_EMAIL=admin@${DOMAIN}
EOF
    
    chmod 600 .env
    print_success "Created basic .env file"
    print_warning "Please run ./setup.sh for full configuration"
fi

# 1. Fix WP-CLI installation (only if needed)
print_status "Checking WP-CLI installation..."
if command -v wp &> /dev/null; then
    CURRENT_WP=$(wp --version --allow-root 2>/dev/null | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' | head -1)
    if [ ! -z "$CURRENT_WP" ]; then
        print_success "WP-CLI is already working: $CURRENT_WP"
    else
        print_status "WP-CLI installation corrupted, fixing..."
        sudo rm -f /usr/local/bin/wp
        curl -O https://raw.githubusercontent.com/wp-cli/wp-cli/master/phar/wp-cli.phar
        chmod +x wp-cli.phar
        sudo mv wp-cli.phar /usr/local/bin/wp
        sudo chmod +x /usr/local/bin/wp
        print_success "WP-CLI fixed: $(wp --version --allow-root 2>/dev/null || echo 'Installed successfully')"
    fi
else
    print_status "Installing WP-CLI..."
    curl -O https://raw.githubusercontent.com/wp-cli/wp-cli/master/phar/wp-cli.phar
    chmod +x wp-cli.phar
    sudo mv wp-cli.phar /usr/local/bin/wp
    sudo chmod +x /usr/local/bin/wp
    print_success "WP-CLI installed: $(wp --version --allow-root 2>/dev/null || echo 'Installed successfully')"
fi

# 2. Fix Lucide React icon imports (including LogoutIcon)
print_status "Fixing Lucide React icon imports..."
find client/src -name "*.jsx" -type f -exec sed -i '
s/GlobeAltIcon/Globe/g
s/CloudIcon/Cloud/g
s/ServerIcon/Server/g
s/CheckCircleIcon/CheckCircle/g
s/MailIcon/Mail/g
s/PlusIcon/Plus/g
s/TrashIcon/Trash/g
s/ShieldCheckIcon/ShieldCheck/g
s/ExclamationTriangleIcon/AlertTriangle/g
s/CogIcon/Settings/g
s/UserIcon/User/g
s/EyeIcon/Eye/g
s/EyeSlashIcon/EyeOff/g
s/DocumentIcon/FileText/g
s/ArrowPathIcon/RotateCcw/g
s/XMarkIcon/X/g
s/ChevronRightIcon/ChevronRight/g
s/ChevronDownIcon/ChevronDown/g
s/HomeIcon/Home/g
s/BarsIcon/Menu/g
s/Bars3Icon/Menu/g
s/XCircleIcon/XCircle/g
s/CheckIcon/Check/g
s/InformationCircleIcon/Info/g
s/ExclamationCircleIcon/AlertCircle/g
s/PencilIcon/Edit/g
s/ArrowRightIcon/ArrowRight/g
s/ArrowLeftIcon/ArrowLeft/g
s/RefreshIcon/RefreshCw/g
s/LogoutIcon/LogOut/g
' {} \;

# Fix common import patterns
find client/src -name "*.jsx" -type f -exec sed -i '
s/{ PlusIcon, TrashIcon, ShieldCheckIcon, GlobeAltIcon }/{ Plus, Trash, ShieldCheck, Globe }/g
s/{ GlobeAltIcon, CloudIcon, ServerIcon, CheckCircleIcon, MailIcon }/{ Globe, Cloud, Server, CheckCircle, Mail }/g
s/{ UserIcon, CogIcon, HomeIcon }/{ User, Settings, Home }/g
s/{ BarsIcon, XMarkIcon }/{ Menu, X }/g
s/{ EyeIcon, EyeSlashIcon }/{ Eye, EyeOff }/g
s/{ DocumentIcon, ArrowPathIcon }/{ FileText, RotateCcw }/g
s/{ ChevronRightIcon, ChevronDownIcon }/{ ChevronRight, ChevronDown }/g
s/{ ExclamationTriangleIcon, CheckCircleIcon }/{ AlertTriangle, CheckCircle }/g
s/{ CheckIcon, XIcon }/{ Check, X }/g
s/{ HomeIcon, GlobeAltIcon, CloudIcon, MailIcon, CogIcon, LogoutIcon }/{ Home, Globe, Cloud, Mail, Settings, LogOut }/g
' {} \;

print_success "Fixed Lucide React icon imports"

# 3. Update package.json files with compatible versions
print_status "Updating package.json files for compatibility..."

# Update client package.json
cat > client/package.json << 'EOF'
{
  "name": "ubuntu-web-panel-client",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --port 3000",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.26.2",
    "axios": "^1.7.9",
    "lucide-react": "^0.295.0",
    "@headlessui/react": "^1.7.19",
    "clsx": "^2.1.1"
  },
  "devDependencies": {
    "@eslint/js": "^9.15.0",
    "@types/react": "^18.2.79",
    "@types/react-dom": "^18.2.25",
    "@vitejs/plugin-react": "^4.3.3",
    "eslint": "^9.15.0",
    "eslint-plugin-react-hooks": "^5.0.0",
    "eslint-plugin-react-refresh": "^0.4.14",
    "globals": "^15.12.0",
    "vite": "^5.4.10",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.14"
  }
}
EOF

# Update main package.json with compatible versions
cat > package.json << 'EOF'
{
  "name": "ubuntu-web-panel",
  "version": "1.0.0",
  "description": "Web panel for Ubuntu server management with Cloudflare integration",
  "main": "server/index.js",
  "scripts": {
    "dev": "concurrently \"npm run server\" \"npm run client\"",
    "server": "nodemon server/index.js",
    "client": "cd client && npm run dev",
    "build": "cd client && npm run build",
    "start": "node server/index.js",
    "install-all": "npm install && cd client && npm install"
  },
  "dependencies": {
    "express": "^4.21.2",
    "cors": "^2.8.5",
    "mongoose": "^8.9.3",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "node-cron": "^3.0.3",
    "axios": "^1.7.9",
    "dotenv": "^16.4.7",
    "multer": "^1.4.5-lts.1",
    "helmet": "^8.0.0",
    "nodemailer": "^6.9.18",
    "mailparser": "^3.6.5",
    "imap": "^0.8.19",
    "validator": "^13.12.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.9",
    "concurrently": "^9.1.0"
  },
  "keywords": ["ubuntu", "server", "management", "cloudflare", "dns", "web-panel"],
  "author": "",
  "license": "MIT"
}
EOF

print_success "Updated package.json files"

# 4. Clean and reinstall dependencies
print_status "Cleaning and reinstalling dependencies..."
rm -rf node_modules package-lock.json
rm -rf client/node_modules client/package-lock.json

print_status "Installing server dependencies..."
npm install

print_status "Installing client dependencies..."
cd client && npm install --legacy-peer-deps && cd ..

# 5. Build the client
print_status "Building client application..."
cd client && npm run build && cd ..

# 6. Check if MongoDB is running
print_status "Checking MongoDB status..."
if ! pgrep -x "mongod" > /dev/null; then
    print_status "Starting MongoDB..."
    sudo systemctl start mongod 2>/dev/null || print_warning "MongoDB not installed or failed to start"
fi

# Create database directory
mkdir -p database

print_success "All dependencies ready!"
echo -e "${BLUE}🌐 Starting Ubuntu Web Panel server...${NC}"
echo ""
echo -e "${GREEN}Access your panel at: http://localhost:3001${NC}"
echo -e "${GREEN}Default login: admin / password${NC}"
echo -e "${YELLOW}⚠️  Remember to change the default password!${NC}"
echo ""

npm start