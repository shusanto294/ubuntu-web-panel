const express = require('express');
const EmailAccount = require('../models/EmailAccount');
const EmailDomain = require('../models/EmailDomain');
const emailService = require('../services/email');
const { authenticateToken } = require('../middleware/auth');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const router = express.Router();
router.use(authenticateToken);

// Email Domains
router.get('/domains', async (req, res) => {
  try {
    const domains = await EmailDomain.find().sort({ createdAt: -1 });
    res.json(domains);
  } catch (error) {
    console.error('Fetch email domains error:', error);
    res.status(500).json({ error: 'Failed to fetch email domains' });
  }
});

router.post('/domains', async (req, res) => {
  try {
    const { domain } = req.body;

    if (!domain || !validator.isFQDN(domain)) {
      return res.status(400).json({ error: 'Valid domain is required' });
    }

    const existingDomain = await EmailDomain.findOne({ domain: domain.toLowerCase() });
    if (existingDomain) {
      return res.status(400).json({ error: 'Email domain already exists' });
    }

    const result = await emailService.addEmailDomain(domain);
    const dkimKeys = await emailService.createDKIMKeys(domain);

    const emailDomain = new EmailDomain({
      domain: domain.toLowerCase(),
      owner: req.user.userId,
      dkimEnabled: !!dkimKeys,
      dkimPrivateKey: dkimKeys?.privateKey,
      dkimPublicKey: dkimKeys?.publicKey
    });

    await emailDomain.save();

    res.json({
      domain: emailDomain.domain,
      dkimEnabled: emailDomain.dkimEnabled,
      dkimPublicKey: dkimKeys?.publicKey,
      message: 'Email domain created successfully'
    });
  } catch (error) {
    console.error('Create email domain error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/domains/:id', async (req, res) => {
  try {
    const domainId = req.params.id;

    const emailDomain = await EmailDomain.findById(domainId);
    if (!emailDomain) {
      return res.status(404).json({ error: 'Email domain not found' });
    }

    const accountCount = await EmailAccount.countDocuments({ domain: emailDomain.domain });
    if (accountCount > 0) {
      return res.status(400).json({ error: 'Cannot delete domain with existing email accounts' });
    }

    await emailService.removeEmailDomain(emailDomain.domain);
    await EmailDomain.findByIdAndDelete(domainId);

    res.json({ message: 'Email domain deleted successfully' });
  } catch (error) {
    console.error('Delete email domain error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Email Accounts
router.get('/accounts', async (req, res) => {
  try {
    const { domain } = req.query;
    const filter = domain ? { domain } : {};
    
    const accounts = await EmailAccount.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    for (const account of accounts) {
      const usage = await emailService.getMailboxUsage(account.email);
      account.usedQuota = usage.used;
    }

    res.json(accounts);
  } catch (error) {
    console.error('Fetch email accounts error:', error);
    res.status(500).json({ error: 'Failed to fetch email accounts' });
  }
});

router.post('/accounts', async (req, res) => {
  try {
    const { email, password, quota = 1000, aliases = [], forwards = [] } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const [username, domain] = email.toLowerCase().split('@');

    const emailDomain = await EmailDomain.findOne({ domain });
    if (!emailDomain) {
      return res.status(400).json({ error: 'Email domain not configured' });
    }

    const existingAccount = await EmailAccount.findOne({ email: email.toLowerCase() });
    if (existingAccount) {
      return res.status(400).json({ error: 'Email account already exists' });
    }

    if (emailDomain.currentAccounts >= emailDomain.maxAccounts) {
      return res.status(400).json({ error: 'Maximum email accounts reached for this domain' });
    }

    await emailService.createEmailAccount(email.toLowerCase(), password, quota);

    const hashedPassword = await bcrypt.hash(password, 10);

    const emailAccount = new EmailAccount({
      email: email.toLowerCase(),
      password: hashedPassword,
      domain,
      quota,
      aliases: aliases.map(alias => alias.toLowerCase()),
      forwards: forwards.map(forward => forward.toLowerCase()),
      owner: req.user.userId
    });

    await emailAccount.save();

    emailDomain.currentAccounts += 1;
    await emailDomain.save();

    for (const alias of aliases) {
      if (alias && validator.isEmail(alias)) {
        await emailService.addAlias(alias.toLowerCase(), email.toLowerCase());
      }
    }

    res.json({
      id: emailAccount._id,
      email: emailAccount.email,
      domain: emailAccount.domain,
      quota: emailAccount.quota,
      aliases: emailAccount.aliases,
      forwards: emailAccount.forwards,
      message: 'Email account created successfully'
    });
  } catch (error) {
    console.error('Create email account error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/accounts/:id', async (req, res) => {
  try {
    const accountId = req.params.id;
    const { quota, aliases = [], forwards = [], isActive } = req.body;

    const emailAccount = await EmailAccount.findById(accountId);
    if (!emailAccount) {
      return res.status(404).json({ error: 'Email account not found' });
    }

    if (quota !== undefined) {
      emailAccount.quota = quota;
      await emailService.setQuota(emailAccount.email, quota);
    }

    if (isActive !== undefined) {
      emailAccount.isActive = isActive;
    }

    for (const oldAlias of emailAccount.aliases) {
      await emailService.removeAlias(oldAlias);
    }

    for (const alias of aliases) {
      if (alias && validator.isEmail(alias)) {
        await emailService.addAlias(alias.toLowerCase(), emailAccount.email);
      }
    }

    emailAccount.aliases = aliases.map(alias => alias.toLowerCase());
    emailAccount.forwards = forwards.map(forward => forward.toLowerCase());

    await emailAccount.save();

    res.json({
      message: 'Email account updated successfully',
      account: {
        id: emailAccount._id,
        email: emailAccount.email,
        quota: emailAccount.quota,
        aliases: emailAccount.aliases,
        forwards: emailAccount.forwards,
        isActive: emailAccount.isActive
      }
    });
  } catch (error) {
    console.error('Update email account error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/accounts/:id', async (req, res) => {
  try {
    const accountId = req.params.id;

    const emailAccount = await EmailAccount.findById(accountId);
    if (!emailAccount) {
      return res.status(404).json({ error: 'Email account not found' });
    }

    await emailService.deleteEmailAccount(emailAccount.email);

    for (const alias of emailAccount.aliases) {
      await emailService.removeAlias(alias);
    }

    const emailDomain = await EmailDomain.findOne({ domain: emailAccount.domain });
    if (emailDomain) {
      emailDomain.currentAccounts = Math.max(0, emailDomain.currentAccounts - 1);
      await emailDomain.save();
    }

    await EmailAccount.findByIdAndDelete(accountId);

    res.json({ message: 'Email account deleted successfully' });
  } catch (error) {
    console.error('Delete email account error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/accounts/:id/password', async (req, res) => {
  try {
    const accountId = req.params.id;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const emailAccount = await EmailAccount.findById(accountId);
    if (!emailAccount) {
      return res.status(404).json({ error: 'Email account not found' });
    }

    await emailService.deleteEmailAccount(emailAccount.email);
    await emailService.createEmailAccount(emailAccount.email, password, emailAccount.quota);

    const hashedPassword = await bcrypt.hash(password, 10);
    emailAccount.password = hashedPassword;
    await emailAccount.save();

    res.json({ message: 'Email password updated successfully' });
  } catch (error) {
    console.error('Change email password error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/accounts/:id/usage', async (req, res) => {
  try {
    const accountId = req.params.id;

    const emailAccount = await EmailAccount.findById(accountId);
    if (!emailAccount) {
      return res.status(404).json({ error: 'Email account not found' });
    }

    const usage = await emailService.getMailboxUsage(emailAccount.email);
    
    emailAccount.usedQuota = usage.used;
    await emailAccount.save();

    res.json({
      email: emailAccount.email,
      quota: emailAccount.quota,
      used: usage.used,
      percentage: Math.round((usage.used / emailAccount.quota) * 100)
    });
  } catch (error) {
    console.error('Get email usage error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Email forwarding and aliases
router.post('/aliases', async (req, res) => {
  try {
    const { alias, destination } = req.body;

    if (!alias || !validator.isEmail(alias)) {
      return res.status(400).json({ error: 'Valid alias email is required' });
    }

    if (!destination || !validator.isEmail(destination)) {
      return res.status(400).json({ error: 'Valid destination email is required' });
    }

    await emailService.addAlias(alias.toLowerCase(), destination.toLowerCase());

    res.json({ 
      alias: alias.toLowerCase(), 
      destination: destination.toLowerCase(),
      message: 'Email alias created successfully' 
    });
  } catch (error) {
    console.error('Create alias error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/aliases/:alias', async (req, res) => {
  try {
    const alias = req.params.alias;

    if (!validator.isEmail(alias)) {
      return res.status(400).json({ error: 'Valid alias email is required' });
    }

    await emailService.removeAlias(alias.toLowerCase());

    res.json({ message: 'Email alias deleted successfully' });
  } catch (error) {
    console.error('Delete alias error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Email system status
router.get('/status', async (req, res) => {
  try {
    const status = await emailService.testEmailConfiguration();
    
    const domainCount = await EmailDomain.countDocuments();
    const accountCount = await EmailAccount.countDocuments();
    const activeAccountCount = await EmailAccount.countDocuments({ isActive: true });

    res.json({
      ...status,
      statistics: {
        domains: domainCount,
        accounts: accountCount,
        activeAccounts: activeAccountCount
      }
    });
  } catch (error) {
    console.error('Email status error:', error);
    res.status(500).json({ error: 'Failed to get email status' });
  }
});

module.exports = router;