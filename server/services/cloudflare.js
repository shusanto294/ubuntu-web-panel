const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class CloudflareService {
  constructor() {
    this.baseUrl = 'https://api.cloudflare.com/client/v4';
    this.settingsFile = path.join(__dirname, '../../database/settings.json');
  }

  async loadSettings() {
    try {
      const data = await fs.readFile(this.settingsFile, 'utf8');
      const settings = JSON.parse(data);
      return settings.cloudflare || {};
    } catch (error) {
      // Fallback to environment variables if settings file doesn't exist
      return {
        apiToken: process.env.CLOUDFLARE_API_TOKEN || '',
        zoneId: process.env.CLOUDFLARE_ZONE_ID || '',
        email: process.env.CLOUDFLARE_EMAIL || ''
      };
    }
  }

  async getHeaders() {
    const settings = await this.loadSettings();
    const headers = {
      'Authorization': `Bearer ${settings.apiToken}`,
      'Content-Type': 'application/json'
    };
    
    if (settings.email) {
      headers['X-Auth-Email'] = settings.email;
    }
    
    return headers;
  }

  async getDefaultZoneId() {
    const settings = await this.loadSettings();
    return settings.zoneId;
  }

  async getZones() {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(`${this.baseUrl}/zones`, { headers });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get zones: ${error.message}`);
    }
  }

  async getDNSRecords(zoneId) {
    try {
      const headers = await this.getHeaders();
      const targetZoneId = zoneId || await this.getDefaultZoneId();
      
      if (!targetZoneId) {
        throw new Error('No zone ID specified and no default zone configured');
      }
      
      const response = await axios.get(`${this.baseUrl}/zones/${targetZoneId}/dns_records`, { 
        headers 
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get DNS records: ${error.message}`);
    }
  }

  async createDNSRecord(zoneId, record) {
    try {
      const headers = await this.getHeaders();
      const targetZoneId = zoneId || await this.getDefaultZoneId();
      
      if (!targetZoneId) {
        throw new Error('No zone ID specified and no default zone configured');
      }
      
      const response = await axios.post(`${this.baseUrl}/zones/${targetZoneId}/dns_records`, record, { 
        headers 
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create DNS record: ${error.message}`);
    }
  }

  async updateDNSRecord(zoneId, recordId, record) {
    try {
      const headers = await this.getHeaders();
      const targetZoneId = zoneId || await this.getDefaultZoneId();
      
      if (!targetZoneId) {
        throw new Error('No zone ID specified and no default zone configured');
      }
      
      const response = await axios.put(`${this.baseUrl}/zones/${targetZoneId}/dns_records/${recordId}`, record, { 
        headers 
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update DNS record: ${error.message}`);
    }
  }

  async deleteDNSRecord(zoneId, recordId) {
    try {
      const headers = await this.getHeaders();
      const targetZoneId = zoneId || await this.getDefaultZoneId();
      
      if (!targetZoneId) {
        throw new Error('No zone ID specified and no default zone configured');
      }
      
      const response = await axios.delete(`${this.baseUrl}/zones/${targetZoneId}/dns_records/${recordId}`, { 
        headers 
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete DNS record: ${error.message}`);
    }
  }

  async createSiteRecords(domain, serverIP, zoneId) {
    const targetZoneId = zoneId || await this.getDefaultZoneId();
    
    if (!targetZoneId) {
      throw new Error('No zone ID specified and no default zone configured');
    }
    
    const records = [
      { type: 'A', name: domain, content: serverIP },
      { type: 'A', name: `www.${domain}`, content: serverIP }
    ];

    const results = [];
    for (const record of records) {
      try {
        const result = await this.createDNSRecord(targetZoneId, record);
        results.push(result);
      } catch (error) {
        console.error(`Failed to create record for ${record.name}:`, error.message);
      }
    }
    return results;
  }

  async testConnection() {
    try {
      const settings = await this.loadSettings();
      
      if (!settings.apiToken) {
        return {
          success: false,
          error: 'No API token configured'
        };
      }

      const headers = await this.getHeaders();
      const response = await axios.get(`${this.baseUrl}/zones`, { 
        headers,
        timeout: 10000
      });

      if (response.data.success) {
        return {
          success: true,
          zones: response.data.result?.length || 0,
          message: `Connected successfully! Found ${response.data.result?.length || 0} zones.`
        };
      } else {
        return {
          success: false,
          error: response.data.errors?.[0]?.message || 'API connection failed'
        };
      }
    } catch (error) {
      let errorMessage = 'Connection test failed';
      
      if (error.response) {
        if (error.response.status === 403) {
          errorMessage = 'Invalid API token or insufficient permissions';
        } else if (error.response.status === 401) {
          errorMessage = 'Authentication failed - check your API token';
        } else if (error.response.data?.errors?.[0]?.message) {
          errorMessage = error.response.data.errors[0].message;
        }
      } else if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
        errorMessage = 'Network connection failed';
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }
}

module.exports = new CloudflareService();