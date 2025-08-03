const axios = require('axios');

class CloudflareService {
  constructor() {
    this.apiToken = process.env.CLOUDFLARE_API_TOKEN;
    this.zoneId = process.env.CLOUDFLARE_ZONE_ID;
    this.baseUrl = 'https://api.cloudflare.com/client/v4';
    
    this.headers = {
      'Authorization': `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json'
    };
  }

  async getZones() {
    try {
      const response = await axios.get(`${this.baseUrl}/zones`, { headers: this.headers });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get zones: ${error.message}`);
    }
  }

  async getDNSRecords(zoneId = this.zoneId) {
    try {
      const response = await axios.get(`${this.baseUrl}/zones/${zoneId}/dns_records`, { 
        headers: this.headers 
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get DNS records: ${error.message}`);
    }
  }

  async createDNSRecord(zoneId = this.zoneId, record) {
    try {
      const response = await axios.post(`${this.baseUrl}/zones/${zoneId}/dns_records`, record, { 
        headers: this.headers 
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create DNS record: ${error.message}`);
    }
  }

  async updateDNSRecord(zoneId = this.zoneId, recordId, record) {
    try {
      const response = await axios.put(`${this.baseUrl}/zones/${zoneId}/dns_records/${recordId}`, record, { 
        headers: this.headers 
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update DNS record: ${error.message}`);
    }
  }

  async deleteDNSRecord(zoneId = this.zoneId, recordId) {
    try {
      const response = await axios.delete(`${this.baseUrl}/zones/${zoneId}/dns_records/${recordId}`, { 
        headers: this.headers 
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete DNS record: ${error.message}`);
    }
  }

  async createSiteRecords(domain, serverIP) {
    const records = [
      { type: 'A', name: domain, content: serverIP },
      { type: 'A', name: `www.${domain}`, content: serverIP }
    ];

    const results = [];
    for (const record of records) {
      try {
        const result = await this.createDNSRecord(this.zoneId, record);
        results.push(result);
      } catch (error) {
        console.error(`Failed to create record for ${record.name}:`, error.message);
      }
    }
    return results;
  }
}

module.exports = new CloudflareService();