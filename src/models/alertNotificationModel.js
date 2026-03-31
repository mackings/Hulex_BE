const mongoose = require('mongoose');

const alertNotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  alertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alert',
    index: true
  },
  message: {
    type: String,
    required: true
  },
  provider: {
    type: Object
  },
  rate: {
    type: Number
  },
  receivedAmount: {
    type: Number
  },
  amount: {
    type: Number
  },
  channel: {
    type: String,
    default: 'push'
  },
  kind: {
    type: String,
    enum: ['alert', 'rate_digest'],
    default: 'alert'
  },
  deliveryStatus: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending'
  },
  triggeredAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AlertNotification', alertNotificationSchema);
