#!/bin/bash

# Ensure script is executable
chmod +x "$0" 2>/dev/null || true

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Ubuntu Web Panel - Starting...${NC}"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo -e "${YELLOW}Run './setup.sh' first to set up the application.${NC}"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d node_modules ]; then
    echo -e "${YELLOW}📦 Installing server dependencies...${NC}"
    npm install
fi

if [ ! -d client/node_modules ]; then
    echo -e "${YELLOW}📦 Installing client dependencies...${NC}"
    cd client && npm install && cd ..
fi

# Build client if needed
if [ ! -d client/dist ]; then
    echo -e "${YELLOW}🔨 Building client application...${NC}"
    cd client && npm run build && cd ..
fi

# Create database directory
mkdir -p database

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo -e "${YELLOW}🗄️  Starting MongoDB...${NC}"
    sudo systemctl start mongod
fi

echo -e "${GREEN}✅ All dependencies ready!${NC}"
echo -e "${BLUE}🌐 Starting Ubuntu Web Panel server...${NC}"
echo ""
echo -e "${GREEN}Access your panel at: http://localhost:3001${NC}"
echo -e "${GREEN}Default login: admin / password${NC}"
echo -e "${YELLOW}⚠️  Remember to change the default password!${NC}"
echo ""

npm start