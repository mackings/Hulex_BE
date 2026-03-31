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
      providers.push(
        formatSendWaveProvider(sendWaveData, sendAmount, sourceCurrency, targetCurrency)
      );
    }
  } catch (err) {
    console.warn('SendWave fetch failed during hourly digest:', err.message);
  }

  return providers;
}

function parsePairs(rawPairs) {
  return rawPairs
    .split(',')
    .map(v => v.trim().toUpperCase())
    .filter(Boolean)
    .map(pair => pair.split('-'))
    .filter(parts => parts.length === 2 && parts[0] && parts[1])
    .map(parts => ({ from: parts[0], to: parts[1] }));
}

function formatPairSummary(pair, providers) {
  if (!providers.length) return null;

  const sorted = [...providers].sort((a, b) => b.receivedAmount - a.receivedAmount);
  const high = sorted[0];
  const low = sorted[sorted.length - 1];

  return `${pair.from}->${pair.to} High ${high.name} ${high.receivedAmount.toFixed(2)}, Low ${low.name} ${low.receivedAmount.toFixed(2)}`;
}

async function buildDigestMessage() {
  const rawPairs = process.env.HOURLY_RATE_PAIRS || 'USD-NGN,GBP-NGN,EUR-NGN';
  const sendAmount = parseFloat(process.env.HOURLY_RATE_AMOUNT || '1');
  const pairs = parsePairs(rawPairs);

  if (!pairs.length || Number.isNaN(sendAmount) || sendAmount <= 0) {
    return null;
  }

  const summaries = await Promise.all(
    pairs.slice(0, 3).map(async pair => {
      try {
        const providers = await fetchProviders(pair.from, pair.to, sendAmount);
        return formatPairSummary(pair, providers);
      } catch (err) {
        console.warn(`Hourly digest pair failed for ${pair.from}-${pair.to}:`, err.message);
        return null;
      }
    })
  );

  const validSummaries = summaries.filter(Boolean);
  if (!validSummaries.length) return null;

  return `Hourly rates (${sendAmount} unit): ${validSummaries.join(' | ')}`;
}

async function runHourlyRatesDigest() {
  const body = await buildDigestMessage();
  if (!body) {
    return { sentUsers: 0, failedUsers: 0, skipped: true, reason: 'No digest content' };
  }

  const users = await User.find({ 'pushTokens.0': { $exists: true } })
    .select('pushTokens')
    .lean();

  let sentUsers = 0;
  let failedUsers = 0;

  for (const user of users) {
    const result = await sendPushToUser(user, {
      title: 'Hourly Rate Update',
      body,
      data: { type: 'hourly_rate_digest' },
      androidChannelId: 'rate_alerts'
    });

    if (result.success) sentUsers += 1;
    else failedUsers += 1;
  }

  return { sentUsers, failedUsers, skipped: false };
}

module.exports = {
  runHourlyRatesDigest
};
