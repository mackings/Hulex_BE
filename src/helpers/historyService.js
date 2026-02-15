const RateHistory = require('../models/rateHistoryModel');

exports.recordRateHistory = async ({
  userId,
  fromCurrency,
  toCurrency,
  amount,
  stats,
  providers
}) => {
  if (!userId) return null;

  return RateHistory.create({
    userId,
    fromCurrency,
    toCurrency,
    amount,
    stats,
    providers,
    checkedAt: new Date()
  });
};
