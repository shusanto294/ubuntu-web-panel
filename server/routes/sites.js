const express = require('express');
const Site = require('../models/Site');
const DNSRecord = require('../models/DNSRecord');
const nginxService = require('../services/nginx');
const cloudflareService = require('../services/cloudflare');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const sites = await Site.find().sort({ createdAt: -1 });
    res.json(sites);
  } catch (error) {
    console.error('Fetch sites error:', error);
    res.status(500).json({ error: 'Failed to fetch sites' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { domain, enableCloudflare, enableSSL, serverIP } = req.body;

    if (!domain) {
      return res.status(400).json({ error: 'Domain is required' });
    }

    const existingSite = await Site.findOne({ domain });
    if (existingSite) {
      return res.status(400).json({ error: 'Site already exists' });
    }

    const nginxResult = await nginxService.createSite(domain, enableSSL);
    
    let cloudflareRecords = [];
    if (enableCloudflare && serverIP) {
      try {
        cloudflareRecords = await cloudflareService.createSiteRecords(domain, serverIP);
      } catch (cfError) {
        console.error('Cloudflare error:', cfError.message);
      }
    }

    const site = new Site({
      domain,
      path: nginxResult.webRoot,
      nginxConfig: nginxResult.configPath,
      sslEnabled: enableSSL,
      cloudflareEnabled: enableCloudflare,
      status: 'active',
      owner: req.user.userId
    });

    await site.save();

    if (cloudflareRecords.length > 0) {
      for (const record of cloudflareRecords) {
        if (record.success) {
          const dnsRecord = new DNSRecord({
            site: site._id,
            recordType: record.result.type,
            name: record.result.name,
            content: record.result.content,
            cloudflareId: record.result.id
          });
          await dnsRecord.save();
        }
      }
    }

    res.json({
      id: site._id,
      domain,
      path: nginxResult.webRoot,
      sslEnabled: enableSSL,
      cloudflareEnabled: enableCloudflare,
      status: 'active',
      cloudflareRecords
    });
  } catch (error) {
    console.error('Create site error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const siteId = req.params.id;

    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    if (site.cloudflareEnabled) {
      const dnsRecords = await DNSRecord.find({ site: siteId });
      for (const record of dnsRecords) {
        try {
          if (record.cloudflareId) {
            await cloudflareService.deleteDNSRecord(undefined, record.cloudflareId);
          }
        } catch (cfError) {
          console.error('Failed to delete Cloudflare record:', cfError.message);
        }
      }
    }

    await nginxService.deleteSite(site.domain);

    await DNSRecord.deleteMany({ site: siteId });
    await Site.findByIdAndDelete(siteId);

    res.json({ message: 'Site deleted successfully' });
  } catch (error) {
    console.error('Delete site error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/ssl', async (req, res) => {
  try {
    const siteId = req.params.id;

    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    await nginxService.enableSSL(site.domain);
    
    site.sslEnabled = true;
    await site.save();

    res.json({ message: 'SSL enabled successfully' });
  } catch (error) {
    console.error('Enable SSL error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/dns', async (req, res) => {
  try {
    const siteId = req.params.id;
    const records = await DNSRecord.find({ site: siteId });
    res.json(records);
  } catch (error) {
    console.error('Fetch DNS records error:', error);
    res.status(500).json({ error: 'Failed to fetch DNS records' });
  }
});

module.exports = router;