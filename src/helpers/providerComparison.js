const { getWiseComparison, getSendWaveRates } = require("./wiseApi");
const { getTaptapSendRates } = require("./taptapSendApi");
const {
  formatProviderData,
  getCountryIso2ByCurrency
} = require("./currencyHelper");

function formatSendWaveProvider(data, sendAmount, sourceCurrency, targetCurrency) {
  const rate = parseFloat(data?.effectiveExchangeRate || data?.baseExchangeRate || 0);
  const fee = parseFloat(data?.effectiveFeeAmount || data?.baseFeeAmount || 0);
  const receivedAmount = parseFloat(data?.receiveAmount || 0);

  return {
    id: "sendwave",
    name: "Sendwave",
    alias: "sendwave",
    type: "remittance",
    logo: null,
    rate: rate || 0,
    fee: fee || 0,
    receivedAmount: receivedAmount || 0,
    sendAmount,
    markup: null,
    deliveryTime: null,
    isMidMarketRate: false,
    sourceCountry: getCountryIso2ByCurrency(sourceCurrency),
    targetCountry: getCountryIso2ByCurrency(targetCurrency),
    dateCollected: new Date().toISOString()
  };
}

function formatTaptapSendProvider(data, sendAmount) {
  return {
    id: "taptapsend",
    name: "Taptap Send",
    alias: "taptapsend",
    type: "remittance",
    logo: null,
    rate: data.rate || 0,
    fee: data.fee || 0,
    receivedAmount: data.receivedAmount || 0,
    sendAmount,
    markup: null,
    deliveryTime: null,
    isMidMarketRate: false,
    sourceCountry: data.sourceCountry,
    targetCountry: data.targetCountry,
    dateCollected: data.dateCollected || new Date().toISOString()
  };
}

function getProviderKey(provider) {
  return String(provider?.alias || provider?.id || provider?.name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function dedupeProviders(providers) {
  const winners = new Map();

  for (const provider of providers.filter(Boolean)) {
    const key = getProviderKey(provider);
    if (!key) {
      continue;
    }

    const existing = winners.get(key);
    if (!existing || Number(provider.receivedAmount || 0) > Number(existing.receivedAmount || 0)) {
      winners.set(key, provider);
    }
  }

  return [...winners.values()];
}

async function fetchComparableProviders({
  sourceCurrency,
  targetCurrency,
  sendAmount,
  fromCountry,
  toCountry
}) {
  const comparisonData = await getWiseComparison(sourceCurrency, targetCurrency, sendAmount);
  const providers = formatProviderData(comparisonData.providers || []);

  const sendCountryIso2 = fromCountry
    ? String(fromCountry).toUpperCase()
    : getCountryIso2ByCurrency(sourceCurrency);
  const receiveCountryIso2 = toCountry
    ? String(toCountry).toUpperCase()
    : getCountryIso2ByCurrency(targetCurrency);

  if (sendCountryIso2 && receiveCountryIso2) {
    const publicProviders = await Promise.all([
      getSendWaveRates(
        sourceCurrency,
        targetCurrency,
        sendCountryIso2,
        receiveCountryIso2,
        sendAmount
      )
        .then((data) =>
          formatSendWaveProvider(data, sendAmount, sourceCurrency, targetCurrency)
        )
        .catch((error) => {
          console.warn("SendWave fetch failed:", error.message);
          return null;
        }),
      getTaptapSendRates(
        sourceCurrency,
        targetCurrency,
        sendCountryIso2,
        receiveCountryIso2,
        sendAmount
      )
        .then((data) => formatTaptapSendProvider(data, sendAmount))
        .catch((error) => {
          console.warn("Taptap Send fetch failed:", error.message);
          return null;
        })
    ]);

    providers.push(...publicProviders.filter(Boolean));
  } else {
    console.warn(
      `Public quote adapters skipped: missing country mapping for ${!sendCountryIso2 ? sourceCurrency : targetCurrency}`
    );
  }

  return dedupeProviders(providers).sort(
    (left, right) => Number(right.receivedAmount || 0) - Number(left.receivedAmount || 0)
  );
}

module.exports = {
  fetchComparableProviders
};
