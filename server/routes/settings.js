const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Settings storage file
const SETTINGS_FILE = path.join(__dirname, '../../database/settings.json');

// Load settings from file
const loadSettings = async () => {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return default settings
    return {
      cloudflare: {
        apiToken: '',
        zoneId: '',
        email: ''
      }
    };
  }
};

// Save settings to file
const saveSettings = async (settings) => {
  try {
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
};

// Get Cloudflare settings
router.get('/cloudflare', authenticateToken, async (req, res) => {
  try {
    const settings = await loadSettings();
    
    // Don't send the full API token, just a masked version
    const cloudflareSettings = {
      ...settings.cloudflare,
      apiToken: settings.cloudflare.apiToken ? 
        settings.cloudflare.apiToken.substring(0, 8) + '...' : ''
    };
    
    res.json(cloudflareSettings);
  } catch (error) {
    console.error('Error loading Cloudflare settings:', error);
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

// Save Cloudflare settings
router.post('/cloudflare', authenticateToken, async (req, res) => {
  try {
    const { apiToken, zoneId, email } = req.body;
    
    if (!apiToken) {
      return res.status(400).json({ error: 'API Token is required' });
    }

    const settings = await loadSettings();
    settings.cloudflare = {
      apiToken: apiToken.trim(),
      zoneId: zoneId?.trim() || '',
      email: email?.trim() || ''
    };

    const saved = await saveSettings(settings);
    if (!saved) {
      return res.status(500).json({ error: 'Failed to save settings' });
    }

    res.json({ message: 'Settings saved successfully' });
  } catch (error) {
    console.error('Error saving Cloudflare settings:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// Test Cloudflare connection
router.post('/cloudflare/test', authenticateToken, async (req, res) => {
  try {
    const { apiToken, email } = req.body;
    
    if (!apiToken) {
      return res.status(400).json({ error: 'API Token is required' });
    }

    // Test API connection by fetching zones
    const headers = {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json'
    };

    if (email) {
      headers['X-Auth-Email'] = email;
    }

    const response = await axios.get('https://api.cloudflare.com/client/v4/zones', {
      headers,
      timeout: 10000
    });

    if (response.data.success) {
      const zones = response.data.result.map(zone => ({
        id: zone.id,
        name: zone.name,
        status: zone.status
      }));

      res.json({
        success: true,
        zones: zones,
        zonesCount: zones.length,
        message: `Successfully connected! Found ${zones.length} zones.`
      });
    } else {
      res.status(400).json({
        success: false,
        error: response.data.errors?.[0]?.message || 'API connection failed'
      });
    }
  } catch (error) {
    console.error('Cloudflare API test error:', error);
    
    let errorMessage = 'Connection test failed';
    
    if (error.response) {
      // API responded with error
      if (error.response.status === 403) {
        errorMessage = 'Invalid API token or insufficient permissions';
      } else if (error.response.status === 401) {
        errorMessage = 'Authentication failed - check your API token';
      } else if (error.response.data?.errors?.[0]?.message) {
        errorMessage = error.response.data.errors[0].message;
      }
    } else if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      errorMessage = 'Network connection failed - check your internet connection';
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(400).json({
      success: false,
      error: errorMessage
    });
  }
});

// Get system information
router.get('/system', authenticateToken, async (req, res) => {
  try {
    const os = require('os');
    const { version } = require('../../package.json');
    
    const systemInfo = {
      panelVersion: version || '1.0.0',
      nodeVersion: process.version,
      platform: os.platform(),
      architecture: os.arch(),
      hostname: os.hostname(),
      uptime: process.uptime(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem()
      },
      cpus: os.cpus().length
    };

    res.json(systemInfo);
  } catch (error) {
    console.error('Error getting system info:', error);
    res.status(500).json({ error: 'Failed to get system information' });
  }
});

// Export settings (for backup)
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const settings = await loadSettings();
    
    // Remove sensitive data for export
    const exportData = {
      ...settings,
      cloudflare: {
        ...settings.cloudflare,
        apiToken: settings.cloudflare.apiToken ? '[REDACTED]' : ''
      }
    };

    res.setHeader('Content-Disposition', 'attachment; filename=panel-settings.json');
    res.setHeader('Content-Type', 'application/json');
    res.json(exportData);
  } catch (error) {
    console.error('Error exporting settings:', error);
    res.status(500).json({ error: 'Failed to export settings' });
  }
});

module.exports = router;