const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  fromCurrency: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  toCurrency: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  amount: {
    type: Number,
    default: 1
  },
  targetAmount: {
    type: Number,
    required: true
  },
  condition: {
    type: String,
    enum: ['gte', 'lte'],
    default: 'gte'
  },
  providerType: {
    type: String,
    default: null
  },
  active: {
    type: Boolean,
    default: true
  },
  lastCheckedAt: {
    type: Date
  },
  lastTriggeredAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Alert', alertSchema);
