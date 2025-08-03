#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🌐 Cloudflare Configuration Helper${NC}"
echo "=================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Please run ./setup.sh first to create the configuration file."
    exit 1
fi

echo -e "${YELLOW}📝 To get your Cloudflare API credentials:${NC}"
echo ""
echo "1. Go to: https://dash.cloudflare.com/profile/api-tokens"
echo "2. Click 'Create Token'"
echo "3. Use 'Custom token' template"
echo "4. Set permissions:"
echo "   - Zone:Zone:Read"
echo "   - Zone:DNS:Edit"
echo "5. Include your zones in 'Zone Resources'"
echo "6. Copy the generated token"
echo ""

# Get API Token
read -p "Enter your Cloudflare API Token: " cf_token
if [ -z "$cf_token" ]; then
    echo -e "${RED}❌ API Token is required!${NC}"
    exit 1
fi

# Get Email (optional but recommended)
read -p "Enter your Cloudflare email (optional): " cf_email

echo ""
echo -e "${BLUE}🔍 Testing API connection...${NC}"

# Test API connection and get zones
response=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones" \
     -H "Authorization: Bearer $cf_token" \
     -H "Content-Type: application/json")

# Check if request was successful
if echo "$response" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ API connection successful!${NC}"
    echo ""
    
    # Extract and display zones
    echo -e "${BLUE}📋 Available zones:${NC}"
    zones=$(echo "$response" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
    zone_ids=$(echo "$response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    
    # Convert to arrays
    IFS=$'\n' read -d '' -r -a zone_array <<< "$zones"
    IFS=$'\n' read -d '' -r -a id_array <<< "$zone_ids"
    
    if [ ${#zone_array[@]} -eq 0 ]; then
        echo -e "${YELLOW}⚠️  No zones found in your account${NC}"
        exit 1
    fi
    
    # Display zones with numbers
    for i in "${!zone_array[@]}"; do
        echo "  $((i+1)). ${zone_array[i]}"
    done
    
    echo ""
    read -p "Select a zone number (1-${#zone_array[@]}): " zone_choice
    
    # Validate choice
    if ! [[ "$zone_choice" =~ ^[0-9]+$ ]] || [ "$zone_choice" -lt 1 ] || [ "$zone_choice" -gt ${#zone_array[@]} ]; then
        echo -e "${RED}❌ Invalid choice!${NC}"
        exit 1
    fi
    
    # Get selected zone details
    selected_zone=${zone_array[$((zone_choice-1))]}
    selected_id=${id_array[$((zone_choice-1))}
    
    echo ""
    echo -e "${GREEN}✅ Selected: $selected_zone ($selected_id)${NC}"
    
else
    echo -e "${RED}❌ API connection failed!${NC}"
    error_msg=$(echo "$response" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
    if [ ! -z "$error_msg" ]; then
        echo "Error: $error_msg"
    fi
    echo ""
    echo "Please check:"
    echo "1. Your API token is correct"
    echo "2. Token has the required permissions"
    echo "3. Your internet connection"
    exit 1
fi

# Update .env file
echo ""
echo -e "${BLUE}💾 Updating .env file...${NC}"

# Backup original .env
cp .env .env.backup

# Update Cloudflare settings
sed -i "s/CLOUDFLARE_API_TOKEN=.*/CLOUDFLARE_API_TOKEN=$cf_token/" .env
sed -i "s/CLOUDFLARE_ZONE_ID=.*/CLOUDFLARE_ZONE_ID=$selected_id/" .env

if [ ! -z "$cf_email" ]; then
    sed -i "s/CLOUDFLARE_EMAIL=.*/CLOUDFLARE_EMAIL=$cf_email/" .env
fi

echo -e "${GREEN}✅ Configuration updated successfully!${NC}"
echo ""
echo -e "${BLUE}📄 Configuration Summary:${NC}"
echo "  • API Token: ${cf_token:0:10}..."
echo "  • Zone: $selected_zone"
echo "  • Zone ID: $selected_id"
if [ ! -z "$cf_email" ]; then
    echo "  • Email: $cf_email"
fi
echo ""
echo -e "${GREEN}🎉 Cloudflare is now configured!${NC}"
echo "You can now create sites with automatic DNS management."
echo ""
echo "Next steps:"
echo "1. Start the panel: bash start.sh"
echo "2. Access: http://$(grep SERVER_IP .env | cut -d'=' -f2):3001"
echo "3. Create your first site!"