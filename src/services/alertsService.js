const Alert = require('../models/alertModel');
const AlertNotification = require('../models/alertNotificationModel');
const User = require('../models/userModel');
const { getWiseComparison, getSendWaveRates } = require('../helpers/wiseApi');
const { formatProviderData, getCountryIso2ByCurrency } = require('../helpers/currencyHelper');
const { sendPushToUser } = require('./pushService');

function formatSendWaveProvider(data, sendAmount, sourceCurrency, targetCurrency) {
  const rate = parseFloat(data?.effectiveExchangeRate || data?.baseExchangeRate || 0);
  const fee = parseFloat(data?.effectiveFeeAmount || data?.baseFeeAmount || 0);
  const receivedAmount = parseFloat(data?.receiveAmount || 0);

  return {
    id: 'sendwave',
    name: 'Sendwave',
    alias: 'sendwave',
    type: 'remittance',
    logo: null,
    rate: rate || 0,
    fee: fee || 0,
    receivedAmount: receivedAmount || 0,
    sendAmount: sendAmount,
    markup: null,
    deliveryTime: null,
    isMidMarketRate: false,
    sourceCountry: getCountryIso2ByCurrency(sourceCurrency),
    targetCountry: getCountryIso2ByCurrency(targetCurrency),
    dateCollected: new Date().toISOString()
  };
}

async function fetchProviders(sourceCurrency, targetCurrency, sendAmount) {
  const comparisonData = await getWiseComparison(sourceCurrency, targetCurrency, sendAmount);
  let providers = formatProviderData(comparisonData.providers || []);

  try {
    const sendCountryIso2 = getCountryIso2ByCurrency(sourceCurrency);
    const receiveCountryIso2 = getCountryIso2ByCurrency(targetCurrency);

    if (sendCountryIso2 && receiveCountryIso2) {
      const sendWaveData = await getSendWaveRates(
        sourceCurrency,
        targetCurrency,
        sendCountryIso2,
        receiveCountryIso2,
        sendAmount
      );
      const sendWaveProvider = formatSendWaveProvider(
        sendWaveData,
        sendAmount,
        sourceCurrency,
        targetCurrency
      );
      providers.push(sendWaveProvider);
    }
  } catch (err) {
    console.warn('SendWave fetch failed during alerts:', err.message);
  }

  return providers;
}

function pickBestProvider(providers, providerType) {
  let list = providers;
  if (providerType) {
    list = providers.filter(p => p.type === providerType);
  }
  if (!list.length) return null;
  list.sort((a, b) => b.receivedAmount - a.receivedAmount);
  return list[0];
}

async function sendPushNotification(user, message) {
  return sendPushToUser(user, {
    title: 'Rate Alert',
    body: message,
    data: { type: 'rate_alert' },
    androidChannelId: 'rate_alerts'
  });
}

async function runAlertCheckForAlert(alert) {
  const providers = await fetchProviders(alert.fromCurrency, alert.toCurrency, alert.amount);
  const bestProvider = pickBestProvider(providers, alert.providerType);

  const now = new Date();
  alert.lastCheckedAt = now;

  if (!bestProvider) {
    await alert.save();
    return { triggered: false, reason: 'No providers available' };
  }

  const receivedAmount = bestProvider.receivedAmount || 0;
  const shouldTrigger = alert.condition === 'lte'
    ? receivedAmount <= alert.targetAmount
    : receivedAmount >= alert.targetAmount;

  if (!shouldTrigger) {
    await alert.save();
    return { triggered: false, bestProvider };
  }

  const message = `Rate alert: ${alert.amount} ${alert.fromCurrency} -> ${receivedAmount.toFixed(2)} ${alert.toCurrency} (target ${alert.condition} ${alert.targetAmount})`;

  const notification = await AlertNotification.create({
    userId: alert.userId,
    alertId: alert._id,
    message,
    provider: bestProvider,
    rate: bestProvider.rate,
    receivedAmount,
    amount: alert.amount,
    channel: 'push',
    deliveryStatus: 'pending',
    triggeredAt: now
  });

  const user = await User.findById(alert.userId).select('pushTokens');
  const pushResult = await sendPushNotification(user, message);

  notification.deliveryStatus = pushResult.success ? 'sent' : 'failed';
  await notification.save();

  alert.lastTriggeredAt = now;
  await alert.save();

  return { triggered: true, notificationId: notification._id };
}

async function runAlertsCheck(filter = {}) {
  const alerts = await Alert.find({ active: true, ...filter }).lean();
  const results = [];

  for (const alert of alerts) {
    const alertDoc = await Alert.findById(alert._id);
    if (!alertDoc) continue;

    try {
      const result = await runAlertCheckForAlert(alertDoc);
      results.push({ alertId: alertDoc._id, ...result });
    } catch (err) {
      console.error('Alert check failed:', err.message);
      results.push({ alertId: alertDoc._id, triggered: false, error: err.message });
    }
  }

  return results;
}

module.exports = {
  runAlertsCheck
};
