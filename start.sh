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

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo -e "${YELLOW}Run './setup.sh' first to set up the application.${NC}"
    exit 1
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

# 2. Fix Lucide React icon imports (only if needed)
print_status "Checking for Lucide React icon import issues..."
ICON_ISSUES=$(grep -r "Icon.*from 'lucide-react'" client/src/ 2>/dev/null | wc -l)
if [ "$ICON_ISSUES" -gt 0 ]; then
    print_status "Found $ICON_ISSUES icon import issues, fixing..."
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
    ' {} \;

    print_success "Fixed Lucide React icon imports"
else
    print_success "Lucide React icon imports are already correct"
fi

# 3. Check and update package.json files if needed
print_status "Checking package.json files for compatibility..."

# Check if client package.json needs updating
if [ -f client/package.json ]; then
    CLIENT_REACT_VERSION=$(grep -o '"react": "[^"]*"' client/package.json | cut -d'"' -f4 | cut -d'.' -f1)
    if [ "$CLIENT_REACT_VERSION" != "18" ]; then
        print_status "Updating client package.json for Node.js 18 compatibility..."
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
        print_success "Updated client package.json"
    fi
fi

# Check if main package.json needs updating
if [ -f package.json ]; then
    MAIN_EXPRESS_VERSION=$(grep -o '"express": "[^"]*"' package.json | cut -d'"' -f4 | cut -d'.' -f1)
    if [ "$MAIN_EXPRESS_VERSION" != "4" ]; then
        print_status "Updating main package.json..."
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
    "mailparser": "^3.8.0",
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
        print_success "Updated main package.json"
    fi
fi

# 4. Clean and reinstall dependencies (only if needed)
print_status "Checking if dependency reinstall is needed..."
REINSTALL_NEEDED=false

# Check if node_modules exists and package.json is newer
if [ ! -d "node_modules" ] || [ package.json -nt node_modules ]; then
    print_status "Server dependencies need updating"
    REINSTALL_NEEDED=true
fi

if [ ! -d "client/node_modules" ] || [ client/package.json -nt client/node_modules ]; then
    print_status "Client dependencies need updating"
    REINSTALL_NEEDED=true
fi

if [ "$REINSTALL_NEEDED" = true ]; then
    print_status "Cleaning old dependencies..."
    rm -rf node_modules package-lock.json
    rm -rf client/node_modules client/package-lock.json

    print_status "Installing server dependencies..."
    npm install

    print_status "Installing client dependencies..."
    cd client && npm install --legacy-peer-deps && cd ..
else
    print_success "Dependencies are already up to date"
fi

# 5. Build the client (only if needed)
print_status "Checking if client build is needed..."
cd client
BUILD_NEEDED=false

# Check if dist folder exists
if [ ! -d "dist" ]; then
    print_status "dist folder doesn't exist, build needed"
    BUILD_NEEDED=true
# Check if any source files are newer than the dist folder
elif [ $(find src -name "*.jsx" -o -name "*.js" -o -name "*.css" -newer dist 2>/dev/null | wc -l) -gt 0 ]; then
    print_status "Source files updated, build needed"
    BUILD_NEEDED=true
# Check if package.json is newer than dist folder
elif [ package.json -nt dist ]; then
    print_status "package.json updated, build needed"
    BUILD_NEEDED=true
else
    print_success "Client build is up to date"
fi

if [ "$BUILD_NEEDED" = true ]; then
    print_status "Building client application..."
    npm run build
else
    print_success "Skipping build - client is already built and up to date"
fi

cd ..

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