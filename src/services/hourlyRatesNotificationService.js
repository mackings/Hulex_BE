const User = require('../models/userModel');
const AlertNotification = require('../models/alertNotificationModel');
const AnonymousWebPushSubscription = require('../models/anonymousWebPushSubscriptionModel');
const { fetchComparableProviders } = require('../helpers/providerComparison');
const { sendPushToUser, sendWebPushToSubscriptions } = require('./pushService');

function parsePairs(rawPairs) {
  return rawPairs
    .split(',')
    .map(v => v.trim().toUpperCase())
    .filter(Boolean)
    .map(pair => pair.split('-'))
    .filter(parts => parts.length === 2 && parts[0] && parts[1])
    .map(parts => ({ from: parts[0], to: parts[1] }));
}

function buildPairSummary(pair, providers) {
  if (!providers.length) return null;

  const sorted = [...providers].sort((a, b) => b.receivedAmount - a.receivedAmount);
  const bestProvider = sorted[0];
  const runnerUp = sorted[1] || null;
  const edgePercent = runnerUp?.receivedAmount
    ? ((bestProvider.receivedAmount - runnerUp.receivedAmount) / runnerUp.receivedAmount) * 100
    : 0;

  return {
    pair,
    bestProvider,
    runnerUp,
    edgePercent
  };
}

async function buildDigestHighlight() {
  const rawPairs = process.env.HOURLY_RATE_PAIRS || 'USD-NGN,GBP-NGN,EUR-NGN';
  const sendAmount = parseFloat(process.env.HOURLY_RATE_AMOUNT || '100');
  const pairs = parsePairs(rawPairs);

  if (!pairs.length || Number.isNaN(sendAmount) || sendAmount <= 0) {
    return null;
  }

  const summaries = await Promise.all(
    pairs.slice(0, 3).map(async pair => {
      try {
        const providers = await fetchComparableProviders({
          sourceCurrency: pair.from,
          targetCurrency: pair.to,
          sendAmount
        });
        return buildPairSummary(pair, providers);
      } catch (err) {
        console.warn(`Rate digest pair failed for ${pair.from}-${pair.to}:`, err.message);
        return null;
      }
    })
  );

  const validSummaries = summaries.filter(Boolean);
  if (!validSummaries.length) {
    return null;
  }

  const strongestSummary = validSummaries.sort((left, right) => right.edgePercent - left.edgePercent)[0];

  return {
    ...strongestSummary,
    sendAmount
  };
}

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0';
  }

  return Number(value).toLocaleString('en-US', {
    maximumFractionDigits: 2
  });
}

function buildDigestMessage(highlight) {
  const { pair, bestProvider, runnerUp, sendAmount } = highlight;
  const leadCopy = runnerUp
    ? ` Ahead of ${runnerUp.name} by ${highlight.edgePercent.toFixed(2)}%.`
    : '';

  return `Best rate now: ${bestProvider.name} leads ${pair.from}->${pair.to} with ${formatNumber(bestProvider.receivedAmount)} ${pair.to} for ${formatNumber(sendAmount)} ${pair.from}. Rate ${formatNumber(bestProvider.rate)}.${leadCopy}`;
}

async function runHourlyRatesDigest() {
  const highlight = await buildDigestHighlight();
  if (!highlight) {
    return { sentUsers: 0, failedUsers: 0, skipped: true, reason: 'No digest content' };
  }

  const title = '5-hour rate update';
  const body = buildDigestMessage(highlight);

  const users = await User.find({ isVerified: true })
    .select('_id pushTokens webPushSubscriptions')
    .lean();
  const seenWebPushEndpoints = new Set();

  let createdUsers = 0;
  let sentUsers = 0;
  let failedUsers = 0;
  let sentAnonymous = 0;
  let failedAnonymous = 0;

  for (const user of users) {
    for (const subscription of user.webPushSubscriptions || []) {
      if (subscription?.endpoint) {
        seenWebPushEndpoints.add(subscription.endpoint);
      }
    }

    const notification = await AlertNotification.create({
      userId: user._id,
      alertId: null,
      message: body,
      provider: highlight.bestProvider,
      rate: highlight.bestProvider.rate,
      receivedAmount: highlight.bestProvider.receivedAmount,
      amount: highlight.sendAmount,
      channel: 'digest',
      kind: 'rate_digest',
      deliveryStatus: 'pending',
      triggeredAt: new Date()
    });
    createdUsers += 1;

    const result = await sendPushToUser(user, {
      title,
      body,
      provider: highlight.bestProvider,
      tag: 'hulex-rate-digest',
      url: '/compare',
      data: {
        type: 'rate_digest',
        provider: highlight.bestProvider.alias || highlight.bestProvider.name,
        fromCurrency: highlight.pair.from,
        toCurrency: highlight.pair.to
      },
      androidChannelId: 'rate_alerts'
    });

    notification.deliveryStatus = result.success ? 'sent' : 'failed';
    await notification.save();

    if (result.success) sentUsers += 1;
    else failedUsers += 1;
  }

  const anonymousSubscriptions = await AnonymousWebPushSubscription.find().lean();
  const deliverableAnonymousSubscriptions = anonymousSubscriptions.filter(
    (subscription) => subscription?.endpoint && !seenWebPushEndpoints.has(subscription.endpoint)
  );

  if (deliverableAnonymousSubscriptions.length) {
    const anonymousResult = await sendWebPushToSubscriptions(deliverableAnonymousSubscriptions, {
      title,
      body,
      provider: highlight.bestProvider,
      tag: 'hulex-rate-digest',
      url: '/compare',
      data: {
        type: 'rate_digest',
        provider: highlight.bestProvider.alias || highlight.bestProvider.name,
        fromCurrency: highlight.pair.from,
        toCurrency: highlight.pair.to
      },
      androidChannelId: 'rate_alerts'
    }, {
      removeInvalidSubscriptions: async (invalidEndpoints) => {
        await AnonymousWebPushSubscription.deleteMany({
          endpoint: { $in: invalidEndpoints }
        });
      }
    });

    sentAnonymous = anonymousResult.sentCount || 0;
    failedAnonymous = anonymousResult.failedCount || 0;
  }

  return {
    createdUsers,
    sentUsers,
    failedUsers,
    sentAnonymous,
    failedAnonymous,
    skipped: false,
    pair: `${highlight.pair.from}-${highlight.pair.to}`,
    provider: highlight.bestProvider.name
  };
}

module.exports = {
  runHourlyRatesDigest
};
