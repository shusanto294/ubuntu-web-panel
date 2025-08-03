const mongoose = require('mongoose');

const emailAccountSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  domain: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  quota: {
    type: Number,
    default: 1000, // MB
    min: 0
  },
  usedQuota: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  aliases: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  forwards: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  autoresponder: {
    enabled: {
      type: Boolean,
      default: false
    },
    subject: String,
    message: String,
    startDate: Date,
    endDate: Date
  },
  spamFilterEnabled: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

emailAccountSchema.index({ email: 1 });
emailAccountSchema.index({ domain: 1 });

module.exports = mongoose.model('EmailAccount', emailAccountSchema);