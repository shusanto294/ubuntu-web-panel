const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class NginxService {
  constructor() {
    this.sitesAvailable = process.env.NGINX_SITES_AVAILABLE || '/etc/nginx/sites-available';
    this.sitesEnabled = process.env.NGINX_SITES_ENABLED || '/etc/nginx/sites-enabled';
    this.webRoot = process.env.WEB_ROOT || '/var/www';
  }

  generateNginxConfig(domain, webRoot, sslEnabled = false) {
    const config = sslEnabled ? this.generateSSLConfig(domain, webRoot) : this.generateBasicConfig(domain, webRoot);
    return config;
  }

  generateBasicConfig(domain, webRoot) {
    return `server {
    listen 80;
    server_name ${domain} www.${domain};
    
    root ${webRoot};
    index index.html index.htm index.php;
    
    location / {
        try_files $uri $uri/ =404;
    }
    
    location ~ \\.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
    }
    
    location ~ /\\.ht {
        deny all;
    }
}`;
  }

  generateSSLConfig(domain, webRoot) {
    return `server {
    listen 80;
    server_name ${domain} www.${domain};
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${domain} www.${domain};
    
    ssl_certificate /etc/letsencrypt/live/${domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;
    
    root ${webRoot};
    index index.html index.htm index.php;
    
    location / {
        try_files $uri $uri/ =404;
    }
    
    location ~ \\.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
    }
    
    location ~ /\\.ht {
        deny all;
    }
}`;
  }

  async createSite(domain, sslEnabled = false) {
    try {
      const siteWebRoot = path.join(this.webRoot, domain);
      const configPath = path.join(this.sitesAvailable, domain);
      const enabledPath = path.join(this.sitesEnabled, domain);
      
      await fs.mkdir(siteWebRoot, { recursive: true });
      
      const indexContent = `<!DOCTYPE html>
<html>
<head>
    <title>Welcome to ${domain}</title>
</head>
<body>
    <h1>Welcome to ${domain}</h1>
    <p>Your site is now configured and ready!</p>
</body>
</html>`;
      
      await fs.writeFile(path.join(siteWebRoot, 'index.html'), indexContent);
      
      const nginxConfig = this.generateNginxConfig(domain, siteWebRoot, sslEnabled);
      await fs.writeFile(configPath, nginxConfig);
      
      try {
        await fs.symlink(configPath, enabledPath);
      } catch (error) {
        if (error.code !== 'EEXIST') throw error;
      }
      
      await this.testAndReload();
      
      return {
        domain,
        webRoot: siteWebRoot,
        configPath,
        sslEnabled
      };
    } catch (error) {
      throw new Error(`Failed to create site: ${error.message}`);
    }
  }

  async deleteSite(domain) {
    try {
      const configPath = path.join(this.sitesAvailable, domain);
      const enabledPath = path.join(this.sitesEnabled, domain);
      const siteWebRoot = path.join(this.webRoot, domain);
      
      try {
        await fs.unlink(enabledPath);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      
      try {
        await fs.unlink(configPath);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      
      await this.testAndReload();
      
      return { domain, deleted: true };
    } catch (error) {
      throw new Error(`Failed to delete site: ${error.message}`);
    }
  }

  async testAndReload() {
    try {
      await execAsync('nginx -t');
      await execAsync('systemctl reload nginx');
      return true;
    } catch (error) {
      throw new Error(`Nginx configuration error: ${error.message}`);
    }
  }

  async enableSSL(domain) {
    try {
      await execAsync(`certbot --nginx -d ${domain} -d www.${domain} --non-interactive --agree-tos --email admin@${domain}`);
      return true;
    } catch (error) {
      throw new Error(`Failed to enable SSL: ${error.message}`);
    }
  }
}

module.exports = new NginxService();