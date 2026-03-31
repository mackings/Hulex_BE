const Alert = require('../models/alertModel');
const AlertNotification = require('../models/alertNotificationModel');
const User = require('../models/userModel');
const { fetchComparableProviders } = require('../helpers/providerComparison');
const { sendPushToUser } = require('./pushService');

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
    tag: 'hulex-rate-alert',
    url: '/dashboard',
    androidChannelId: 'rate_alerts'
  });
}

async function runAlertCheckForAlert(alert) {
  const providers = await fetchComparableProviders({
    sourceCurrency: alert.fromCurrency,
    targetCurrency: alert.toCurrency,
    sendAmount: alert.amount
  });
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

  const user = await User.findById(alert.userId).select('pushTokens webPushSubscriptions');
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
