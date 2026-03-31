const axios = require("axios");

const TAPTAP_FX_URL = "https://api.taptapsend.com/api/fxRates";
const TAPTAP_HEADERS = {
  "Appian-Version": "web/2022-05-03.0",
  "X-Device-Id": "web",
  "X-Device-Model": "web",
  Accept: "application/json",
  "User-Agent": "Mozilla/5.0"
};

function parseNumber(value) {
  const numeric = parseFloat(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function roundToScale(value, scale = 2) {
  const safeScale = Number.isFinite(scale) ? scale : 2;
  return Number(value.toFixed(Math.max(0, safeScale)));
}

function calculateFeeAmount(amount, feeSchedule) {
  if (!feeSchedule) {
    return 0;
  }

  if (feeSchedule.type === "standard") {
    let fee =
      (feeSchedule.flatFee ? parseNumber(feeSchedule.flatFee) : 0) +
      (feeSchedule.feePercent ? (parseNumber(feeSchedule.feePercent) / 100) * amount : 0);

    if (feeSchedule.maxFee != null) {
      fee = Math.min(parseNumber(feeSchedule.maxFee), fee);
    }

    return fee;
  }

  if (feeSchedule.type === "tiered" && Array.isArray(feeSchedule.tiers)) {
    const match = [...feeSchedule.tiers]
      .sort((left, right) => parseNumber(right.minValue) - parseNumber(left.minValue))
      .find((tier) => amount >= parseNumber(tier.minValue));

    return match ? parseNumber(match.fee) : 0;
  }

  return 0;
}

async function getTaptapFxData() {
  const response = await axios.get(TAPTAP_FX_URL, {
    headers: TAPTAP_HEADERS
  });

  return response.data;
}

async function getTaptapSendRates(sendCurrency, receiveCurrency, sendCountryIso2, receiveCountryIso2, amount) {
  const payload = await getTaptapFxData();
  const availableCountries = payload?.availableCountries || [];

  const origin = availableCountries.find(
    (item) =>
      String(item?.isoCountryCode || "").toUpperCase() === String(sendCountryIso2 || "").toUpperCase() &&
      String(item?.currency || "").toUpperCase() === String(sendCurrency || "").toUpperCase()
  );

  if (!origin) {
    throw new Error(
      `Taptap Send does not expose a public ${sendCountryIso2}/${sendCurrency} origin corridor`
    );
  }

  const corridor = (origin.corridors || []).find(
    (item) =>
      String(item?.isoCountryCode || "").toUpperCase() === String(receiveCountryIso2 || "").toUpperCase() &&
      String(item?.currency || "").toUpperCase() === String(receiveCurrency || "").toUpperCase()
  );

  if (!corridor) {
    throw new Error(
      `Taptap Send does not expose a public ${sendCurrency} to ${receiveCurrency} corridor for ${sendCountryIso2} to ${receiveCountryIso2}`
    );
  }

  const rate = parseNumber(corridor.fxRate);
  const fee = calculateFeeAmount(amount, corridor.feeSchedule);
  const receivedAmount = roundToScale(amount * rate, corridor.currencyScale);

  return {
    rate,
    fee: roundToScale(fee, 2),
    receivedAmount,
    sendAmount: amount,
    sourceCountry: String(sendCountryIso2 || "").toUpperCase(),
    targetCountry: String(receiveCountryIso2 || "").toUpperCase(),
    currencyScale: corridor.currencyScale,
    feeSchedule: corridor.feeSchedule || null,
    dateCollected: new Date().toISOString()
  };
}

module.exports = {
  calculateFeeAmount,
  getTaptapSendRates
};
