const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const execAsync = util.promisify(exec);

class EmailService {
  constructor() {
    this.postfixConfigPath = process.env.POSTFIX_CONFIG_PATH || '/etc/postfix';
    this.dovecotConfigPath = process.env.DOVECOT_CONFIG_PATH || '/etc/dovecot';
    this.virtualDomainsFile = process.env.POSTFIX_VIRTUAL_MAILBOX_DOMAINS || '/etc/postfix/virtual_mailbox_domains';
    this.virtualMapsFile = process.env.POSTFIX_VIRTUAL_MAILBOX_MAPS || '/etc/postfix/virtual_mailbox_maps';
    this.virtualAliasFile = process.env.POSTFIX_VIRTUAL_ALIAS_MAPS || '/etc/postfix/virtual_alias_maps';
    this.dovecotUsersFile = process.env.DOVECOT_USERS_FILE || '/etc/dovecot/users';
    this.mailHome = process.env.MAIL_HOME || '/var/mail';
  }

  async createEmailAccount(email, password, quota = 1000) {
    try {
      const [username, domain] = email.split('@');
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await this.addVirtualMailbox(email);
      await this.addDovecotUser(email, hashedPassword);
      await this.createMailDirectory(email);
      await this.setQuota(email, quota);
      await this.reloadServices();
      
      return {
        email,
        domain,
        quota,
        created: true
      };
    } catch (error) {
      throw new Error(`Failed to create email account: ${error.message}`);
    }
  }

  async deleteEmailAccount(email) {
    try {
      await this.removeVirtualMailbox(email);
      await this.removeDovecotUser(email);
      await this.removeMailDirectory(email);
      await this.reloadServices();
      
      return { email, deleted: true };
    } catch (error) {
      throw new Error(`Failed to delete email account: ${error.message}`);
    }
  }

  async addEmailDomain(domain) {
    try {
      await this.addVirtualDomain(domain);
      await this.createDKIMKeys(domain);
      await this.reloadServices();
      
      return { domain, added: true };
    } catch (error) {
      throw new Error(`Failed to add email domain: ${error.message}`);
    }
  }

  async removeEmailDomain(domain) {
    try {
      await this.removeVirtualDomain(domain);
      await this.removeDKIMKeys(domain);
      await this.reloadServices();
      
      return { domain, removed: true };
    } catch (error) {
      throw new Error(`Failed to remove email domain: ${error.message}`);
    }
  }

  async addAlias(alias, destination) {
    try {
      const aliasContent = await fs.readFile(this.virtualAliasFile, 'utf8').catch(() => '');
      const newAlias = `${alias} ${destination}\n`;
      
      if (!aliasContent.includes(alias)) {
        await fs.appendFile(this.virtualAliasFile, newAlias);
        await execAsync('postmap /etc/postfix/virtual_alias_maps');
        await this.reloadServices();
      }
      
      return { alias, destination, added: true };
    } catch (error) {
      throw new Error(`Failed to add alias: ${error.message}`);
    }
  }

  async removeAlias(alias) {
    try {
      const aliasContent = await fs.readFile(this.virtualAliasFile, 'utf8');
      const lines = aliasContent.split('\n').filter(line => !line.startsWith(alias + ' '));
      
      await fs.writeFile(this.virtualAliasFile, lines.join('\n'));
      await execAsync('postmap /etc/postfix/virtual_alias_maps');
      await this.reloadServices();
      
      return { alias, removed: true };
    } catch (error) {
      throw new Error(`Failed to remove alias: ${error.message}`);
    }
  }

  async addVirtualDomain(domain) {
    const domainsContent = await fs.readFile(this.virtualDomainsFile, 'utf8').catch(() => '');
    
    if (!domainsContent.includes(domain)) {
      await fs.appendFile(this.virtualDomainsFile, `${domain}\n`);
    }
  }

  async removeVirtualDomain(domain) {
    const domainsContent = await fs.readFile(this.virtualDomainsFile, 'utf8');
    const lines = domainsContent.split('\n').filter(line => line.trim() !== domain);
    await fs.writeFile(this.virtualDomainsFile, lines.join('\n'));
  }

  async addVirtualMailbox(email) {
    const [username, domain] = email.split('@');
    const mailboxPath = `${domain}/${username}/`;
    
    const mapsContent = await fs.readFile(this.virtualMapsFile, 'utf8').catch(() => '');
    
    if (!mapsContent.includes(email)) {
      await fs.appendFile(this.virtualMapsFile, `${email} ${mailboxPath}\n`);
      await execAsync('postmap /etc/postfix/virtual_mailbox_maps');
    }
  }

  async removeVirtualMailbox(email) {
    const mapsContent = await fs.readFile(this.virtualMapsFile, 'utf8');
    const lines = mapsContent.split('\n').filter(line => !line.startsWith(email + ' '));
    
    await fs.writeFile(this.virtualMapsFile, lines.join('\n'));
    await execAsync('postmap /etc/postfix/virtual_mailbox_maps');
  }

  async addDovecotUser(email, hashedPassword) {
    const userEntry = `${email}:{CRYPT}${hashedPassword}\n`;
    await fs.appendFile(this.dovecotUsersFile, userEntry);
  }

  async removeDovecotUser(email) {
    const usersContent = await fs.readFile(this.dovecotUsersFile, 'utf8');
    const lines = usersContent.split('\n').filter(line => !line.startsWith(email + ':'));
    await fs.writeFile(this.dovecotUsersFile, lines.join('\n'));
  }

  async createMailDirectory(email) {
    const [username, domain] = email.split('@');
    const mailDir = path.join(this.mailHome, domain, username);
    
    try {
      await fs.mkdir(mailDir, { recursive: true });
      await execAsync(`chown -R vmail:vmail ${path.join(this.mailHome, domain)}`);
      await execAsync(`chmod -R 755 ${path.join(this.mailHome, domain)}`);
    } catch (error) {
      console.log(`Mail directory might already exist: ${mailDir}`);
    }
  }

  async removeMailDirectory(email) {
    const [username, domain] = email.split('@');
    const mailDir = path.join(this.mailHome, domain, username);
    
    try {
      await execAsync(`rm -rf ${mailDir}`);
    } catch (error) {
      console.log(`Mail directory removal failed: ${mailDir}`);
    }
  }

  async setQuota(email, quotaMB) {
    try {
      await execAsync(`doveadm quota set -u ${email} STORAGE ${quotaMB}M`);
    } catch (error) {
      console.log(`Quota setting failed for ${email}: ${error.message}`);
    }
  }

  async createDKIMKeys(domain) {
    try {
      const dkimDir = `/etc/opendkim/keys/${domain}`;
      await fs.mkdir(dkimDir, { recursive: true });
      
      await execAsync(`opendkim-genkey -t -s default -d ${domain}`, { cwd: dkimDir });
      
      const privateKey = await fs.readFile(path.join(dkimDir, 'default.private'), 'utf8');
      const publicKey = await fs.readFile(path.join(dkimDir, 'default.txt'), 'utf8');
      
      return { privateKey, publicKey };
    } catch (error) {
      console.log(`DKIM key generation failed for ${domain}: ${error.message}`);
      return null;
    }
  }

  async removeDKIMKeys(domain) {
    try {
      const dkimDir = `/etc/opendkim/keys/${domain}`;
      await execAsync(`rm -rf ${dkimDir}`);
    } catch (error) {
      console.log(`DKIM key removal failed for ${domain}: ${error.message}`);
    }
  }

  async reloadServices() {
    try {
      await execAsync('systemctl reload postfix');
      await execAsync('systemctl reload dovecot');
      await execAsync('systemctl reload opendkim');
    } catch (error) {
      console.log(`Service reload failed: ${error.message}`);
    }
  }

  async getMailboxUsage(email) {
    try {
      const { stdout } = await execAsync(`doveadm quota get -u ${email}`);
      return this.parseQuotaOutput(stdout);
    } catch (error) {
      return { used: 0, limit: 0 };
    }
  }

  parseQuotaOutput(output) {
    const lines = output.split('\n');
    let used = 0, limit = 0;
    
    for (const line of lines) {
      if (line.includes('STORAGE')) {
        const parts = line.split(/\s+/);
        used = parseInt(parts[2]) || 0;
        limit = parseInt(parts[3]) || 0;
        break;
      }
    }
    
    return { used: Math.round(used / 1024), limit: Math.round(limit / 1024) };
  }

  async testEmailConfiguration() {
    try {
      await execAsync('postfix check');
      await execAsync('doveconf -n > /dev/null');
      
      return { success: true, message: 'Email configuration is valid' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();