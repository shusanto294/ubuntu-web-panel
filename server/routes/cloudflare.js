const express = require('express');
const cloudflareService = require('../services/cloudflare');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/zones', async (req, res) => {
  try {
    const zones = await cloudflareService.getZones();
    res.json(zones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/zones/:zoneId/dns', async (req, res) => {
  try {
    const { zoneId } = req.params;
    const records = await cloudflareService.getDNSRecords(zoneId);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/zones/:zoneId/dns', async (req, res) => {
  try {
    const { zoneId } = req.params;
    const record = req.body;
    const result = await cloudflareService.createDNSRecord(zoneId, record);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/zones/:zoneId/dns/:recordId', async (req, res) => {
  try {
    const { zoneId, recordId } = req.params;
    const record = req.body;
    const result = await cloudflareService.updateDNSRecord(zoneId, recordId, record);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/zones/:zoneId/dns/:recordId', async (req, res) => {
  try {
    const { zoneId, recordId } = req.params;
    const result = await cloudflareService.deleteDNSRecord(zoneId, recordId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/test', async (req, res) => {
  try {
    const zones = await cloudflareService.getZones();
    res.json({ 
      success: true, 
      message: 'Cloudflare API connection successful',
      zones: zones.result?.length || 0
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;