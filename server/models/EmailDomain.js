const mongoose = require('mongoose');

const emailDomainSchema = new mongoose.Schema({
  domain: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  maxAccounts: {
    type: Number,
    default: 100
  },
  currentAccounts: {
    type: Number,
    default: 0
  },
  dkimEnabled: {
    type: Boolean,
    default: false
  },
  dkimPrivateKey: {
    type: String
  },
  dkimPublicKey: {
    type: String
  },
  spfRecord: {
    type: String,
    default: 'v=spf1 mx ~all'
  },
  dmarcRecord: {
    type: String,
    default: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@'
  },
  catchAll: {
    enabled: {
      type: Boolean,
      default: false
    },
    destination: {
      type: String
    }
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

emailDomainSchema.index({ domain: 1 });

module.exports = mongoose.model('EmailDomain', emailDomainSchema);