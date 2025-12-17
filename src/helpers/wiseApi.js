const axios = require('axios');
const WISE_API_BASE = process.env.WISE_API_BASE || 'https://api.wise.com/v1';
const WISE_API_KEY = process.env.WISE_API_KEY;

async function getWiseComparison(sourceCurrency, targetCurrency, sendAmount) {
  try {
    const response = await axios.get('https://api.wise.com/v4/comparisons/', {
      params: {
        sourceCurrency,
        targetCurrency,
        sendAmount,
        amountType: 'SEND'
      }
    });
    return response.data;
  } catch (error) {
    throw new Error(`Wise comparison API error: ${error.message}`);
  }
}

async function getWiseRates(from, to, amount) {
  try {
    if (!WISE_API_KEY) {
      throw new Error('WISE_API_KEY is not configured in environment variables');
    }

    const response = await axios.get(`${WISE_API_BASE}/rates`, {
      params: { 
        source: from, 
        target: to,
        amount: amount 
      },
      headers: {
        Authorization: `Bearer ${WISE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const rateObj = response.data[0];

    return {
      rate: rateObj.rate,
      source: rateObj.source,
      target: rateObj.target,
      time: rateObj.time,
      amount: amount
    };
  } catch (error) {
    console.error('Wise API error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.error_description ||
      error.response?.data?.error ||
      error.message
    );
  }
}

async function getSendWaveRates(sendCurrency, receiveCurrency, sendCountryIso2, receiveCountryIso2, amount) {
  try {
    const response = await axios.get('https://app.sendwave.com/v2/pricing-public', {
      params: {
        amountType: 'SEND',
        amount: amount,
        sendCurrency: sendCurrency,
        sendCountryIso2: sendCountryIso2,
        receiveCurrency: receiveCurrency,
        receiveCountryIso2: receiveCountryIso2
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    return response.data;
  } catch (error) {
    throw new Error(`SendWave API error: ${error.message}`);
  }
}



module.exports = {
  getWiseComparison,
  getWiseRates,
  getSendWaveRates
};