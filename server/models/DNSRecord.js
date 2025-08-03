const mongoose = require('mongoose');

const dnsRecordSchema = new mongoose.Schema({
  site: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: true
  },
  recordType: {
    type: String,
    required: true,
    enum: ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'SRV', 'NS', 'PTR']
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  ttl: {
    type: Number,
    default: 300
  },
  priority: {
    type: Number,
    default: 0
  },
  cloudflareId: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

dnsRecordSchema.index({ site: 1 });
dnsRecordSchema.index({ recordType: 1 });

module.exports = mongoose.model('DNSRecord', dnsRecordSchema);