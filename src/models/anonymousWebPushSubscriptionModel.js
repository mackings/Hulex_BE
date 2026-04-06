const mongoose = require('mongoose');

const anonymousWebPushSubscriptionSchema = new mongoose.Schema(
  {
    endpoint: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    expirationTime: {
      type: Date,
      default: null
    },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true }
    },
    userAgent: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  'AnonymousWebPushSubscription',
  anonymousWebPushSubscriptionSchema
);
