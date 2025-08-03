# 🚀 Ubuntu Web Panel

A modern, comprehensive web-based control panel for Ubuntu servers featuring automatic Cloudflare DNS management, SSL certificate handling, and complete email server management.

![Ubuntu Web Panel](https://img.shields.io/badge/Ubuntu-Web%20Panel-orange?style=for-the-badge&logo=ubuntu)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?style=for-the-badge&logo=node.js)
![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)

## ✨ Features

### 🌐 Website Management
- **One-click Site Creation**: Automatically create websites with Nginx configuration
- **SSL Automation**: Automatic Let's Encrypt SSL certificate installation and renewal
- **File Manager**: Built-in file management for website content

### ☁️ Cloudflare Integration
- **DNS Management**: Complete Cloudflare DNS record management
- **Automatic Records**: Auto-create A, CNAME, MX records
- **Zone Management**: Multi-zone support

### 📧 Email Server (Full Featured)
- **Complete Mail Stack**: Postfix + Dovecot + OpenDKIM
- **Domain Management**: Add/remove email domains
- **Account Management**: Create/delete email accounts and aliases
- **DKIM/SPF/DMARC**: Automatic email security setup
- **Anti-spam**: Built-in spam protection

### 🔒 Security & Authentication
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Admin and user roles
- **Secure Configuration**: Best practices implemented

### 📊 Modern Interface
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Updates**: Live status monitoring
- **Intuitive UI**: Clean, modern React-based interface

## 🚀 Quick Start (3 Commands!)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/ubuntu-web-panel.git
cd ubuntu-web-panel
```

### 2. Run the Setup Script
```bash
chmod +x setup.sh
./setup.sh
```

### 3. Start the Panel
```bash
./start.sh
```

That's it! 🎉

## 📋 System Requirements

- **OS**: Ubuntu 18.04+ (20.04 LTS recommended)
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 10GB free space
- **Network**: Internet connection for package downloads
- **Access**: Sudo privileges

## 🛠️ What the Setup Script Installs

The setup script automatically installs and configures:

### System Dependencies
- **Node.js 18**: JavaScript runtime
- **Nginx**: Web server
- **MongoDB**: Database
- **Certbot**: SSL certificate management

### Email Server Stack
- **Postfix**: SMTP server
- **Dovecot**: IMAP/POP3 server  
- **OpenDKIM**: Email signing
- **Virtual mail user**: Secure mail handling

### Security & Permissions
- **Firewall rules**: Secure port configuration
- **Sudo permissions**: Limited, secure access
- **File permissions**: Proper ownership and access

## ⚙️ Configuration

### Environment Variables (.env)

The setup script creates a `.env` file. Edit it with your configuration:

```env
# 🌐 Cloudflare API (Required for DNS management)
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here
CLOUDFLARE_ZONE_ID=your_default_zone_id_here

# 🔑 Security
JWT_SECRET=your_secure_random_string_here

# 🖥️ Server
PORT=3001
NODE_ENV=production

# 🗄️ Database
MONGODB_URI=mongodb://localhost:27017/ubuntu_web_panel

# 📧 Email Configuration
MAIL_SERVER=mail.yourdomain.com
MAIL_PORT=587
MAIL_SECURITY=tls
MAIL_AUTH_USER=admin@yourdomain.com
MAIL_AUTH_PASSWORD=your_mail_password
```

### 🌐 Cloudflare API Setup

1. **Visit**: [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. **Create Token** with permissions:
   - `Zone:Zone:Read`
   - `Zone:DNS:Edit`
3. **Include your zones** in token scope
4. **Copy token** to `.env` file

## 📱 Usage Guide

### 🏠 Dashboard
- Overview of all services
- Quick actions and statistics
- System status monitoring

### 🌐 Website Management
1. Navigate to **Sites** section
2. Click **"Add New Site"**
3. Enter domain name
4. Enable Cloudflare DNS (optional)
5. Enable SSL certificates (optional)
6. Click **"Create"**

**What happens automatically:**
- ✅ Creates `/var/www/yourdomain.com/`
- ✅ Generates Nginx virtual host
- ✅ Creates Cloudflare DNS records
- ✅ Installs SSL certificate
- ✅ Enables and reloads Nginx

### 📧 Email Management
1. Go to **Email** section
2. **Add Domain**: Create email domain
3. **Add Account**: Create email addresses
4. **Configure DNS**: Add MX/SPF/DKIM records
5. **Test**: Send test emails

### 🌐 DNS Management
1. Navigate to **DNS** section
2. Select Cloudflare zone
3. Add/edit/delete records
4. Changes apply immediately

## 🗂️ Project Structure

```
ubuntu-web-panel/
├── 📁 server/              # Backend API
│   ├── 📁 routes/          # API endpoints
│   ├── 📁 services/        # Business logic
│   ├── 📁 middleware/      # Authentication, logging
│   └── 📄 index.js         # Main server file
├── 📁 client/              # Frontend React app
│   ├── 📁 src/
│   │   ├── 📁 components/  # React components
│   │   ├── 📄 App.jsx      # Main app
│   │   └── 📄 main.jsx     # Entry point
│   └── 📁 dist/           # Built files
├── 📁 database/           # SQLite database
├── 📄 .env               # Configuration
├── 📄 setup.sh           # Installation script
├── 📄 start.sh           # Start script
└── 📄 package.json       # Dependencies
```

## 🔧 Commands Reference

### Development
```bash
npm run dev          # Start development server
npm run server       # Backend only
npm run client       # Frontend only
```

### Production
```bash
./start.sh           # Start production server
npm start            # Direct start (no checks)
npm run build        # Build client only
```

### System Management
```bash
# Check services
sudo systemctl status nginx
sudo systemctl status mongod
sudo systemctl status postfix

# View logs
sudo tail -f /var/log/nginx/error.log
sudo journalctl -u mongod
```

## 🛡️ Security Features

### 🔒 Built-in Security
- **JWT Authentication**: Secure session management
- **Password Hashing**: bcrypt encryption
- **Input Validation**: All inputs sanitized
- **CORS Protection**: Configured cross-origin policies
- **Helmet.js**: Security headers

### 🚧 Firewall Configuration
```bash
# Enable firewall
sudo ufw enable

# Allow necessary ports
sudo ufw allow 22         # SSH
sudo ufw allow 80         # HTTP
sudo ufw allow 443        # HTTPS
sudo ufw allow 3001       # Web Panel
sudo ufw allow 25,587     # SMTP
sudo ufw allow 993,995    # IMAPS/POP3S
```

### 🔑 Default Credentials
- **Username**: `admin`
- **Password**: `password`
- **⚠️ IMPORTANT**: Change immediately after first login!

## 🚨 Troubleshooting

### Common Issues

#### 🔴 "Cannot connect to database"
```bash
# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Check status
sudo systemctl status mongod
```

#### 🔴 "Permission denied" errors
```bash
# Fix web directory permissions
sudo chown -R $USER:www-data /var/www
sudo chmod -R 755 /var/www

# Check sudoers file
sudo cat /etc/sudoers.d/webpanel
```

#### 🔴 "SSL certificate failed"
```bash
# Check domain DNS
nslookup yourdomain.com

# Manual certificate
sudo certbot --nginx -d yourdomain.com

# Check Nginx config
sudo nginx -t
```

#### 🔴 Email not working
```bash
# Check mail services
sudo systemctl status postfix
sudo systemctl status dovecot

# Check mail logs
sudo tail -f /var/log/mail.log

# Test SMTP
telnet localhost 25
```

### Log Locations
- **Application**: `~/.pm2/logs/` (if using PM2)
- **Nginx**: `/var/log/nginx/`
- **Mail**: `/var/log/mail.log`
- **MongoDB**: `/var/log/mongodb/`

## 🚀 Production Deployment

### Process Management with PM2
```bash
# Install PM2
sudo npm install -g pm2

# Start with PM2
pm2 start server/index.js --name "ubuntu-web-panel"

# Auto-start on boot
pm2 startup
pm2 save
```

### Reverse Proxy (Optional)
```nginx
# /etc/nginx/sites-available/panel.yourdomain.com
server {
    listen 80;
    server_name panel.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔄 Updates & Maintenance

### Update the Panel
```bash
# Backup database
cp database/panel.db database/panel.db.backup

# Pull updates
git pull origin main

# Install dependencies
npm install
cd client && npm install && cd ..

# Rebuild
cd client && npm run build && cd ..

# Restart
./start.sh
```

### Database Backup
```bash
# Create backup
mongodump --host localhost:27017 --db ubuntu_web_panel --out backup/

# Restore backup
mongorestore --host localhost:27017 --db ubuntu_web_panel backup/ubuntu_web_panel/
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md).

### Development Setup
```bash
# Fork and clone
git clone https://github.com/yourusername/ubuntu-web-panel.git
cd ubuntu-web-panel

# Install dependencies
npm install
cd client && npm install && cd ..

# Start development
npm run dev
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 💬 Support

### Getting Help
1. 📖 Check this README
2. 🔍 Search [GitHub Issues](https://github.com/yourusername/ubuntu-web-panel/issues)
3. 🆕 Create a [New Issue](https://github.com/yourusername/ubuntu-web-panel/issues/new)

### Community
- 💬 [Discussions](https://github.com/yourusername/ubuntu-web-panel/discussions)
- 📧 Email: support@yourproject.com

---

<div align="center">

**⭐ Star this project if you find it useful!**

Made with ❤️ for the Ubuntu community

[🏠 Home](https://github.com/yourusername/ubuntu-web-panel) • [📚 Docs](https://docs.yourproject.com) • [🐛 Issues](https://github.com/yourusername/ubuntu-web-panel/issues) • [💬 Discussions](https://github.com/yourusername/ubuntu-web-panel/discussions)

</div>