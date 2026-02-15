const mongoose = require('mongoose');

const providerSnapshotSchema = new mongoose.Schema({
  id: { type: String },
  name: { type: String },
  alias: { type: String },
  type: { type: String },
  logo: { type: String },
  rate: { type: Number },
  fee: { type: Number },
  receivedAmount: { type: Number },
  sendAmount: { type: Number },
  markup: { type: Number },
  deliveryTime: { type: mongoose.Schema.Types.Mixed },
  isMidMarketRate: { type: Boolean },
  sourceCountry: { type: String },
  targetCountry: { type: String },
  dateCollected: { type: String }
}, { _id: false });

const rateHistorySchema = new mongoose.Schema({
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
    required: true
  },
  stats: {
    bestRate: { type: Object },
    worstRate: { type: Object },
    averageReceivedAmount: { type: Number },
    averageRate: { type: Number },
    totalProviders: { type: Number },
    savingsWithBest: { type: Number }
  },
  providers: {
    type: [providerSnapshotSchema],
    default: []
  },
  checkedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('RateHistory', rateHistorySchema);
