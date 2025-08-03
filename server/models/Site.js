const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema({
  domain: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  path: {
    type: String,
    required: true
  },
  nginxConfig: {
    type: String
  },
  sslEnabled: {
    type: Boolean,
    default: false
  },
  cloudflareEnabled: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  sslExpiry: {
    type: Date
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Site', siteSchema);