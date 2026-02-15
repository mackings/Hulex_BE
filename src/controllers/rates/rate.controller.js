const axios = require("axios");
const https = require("https");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
require('dotenv').config();
const {getRevolutRates } = require("../Utils/revolut")




const { getWiseComparison, getWiseRates ,getSendWaveRates, } = require('../../helpers/wiseApi');
const {
  validateCurrency,
  getCurrencyDetails,
  formatProviderData,
  countriesData,
  getCountryIso2ByCurrency
} = require('../../helpers/currencyHelper');
const { recordRateHistory } = require('../../helpers/historyService');

// Map SendWave response into the same provider-shaped object the comparison API returns
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




exports.GetRatesComparison = async (req, res) => {
  try {
    const { 
      fromCurrency,
      toCurrency,
      amount,
      providerTypes
    } = req.query;

    // Validate required parameters
    if (!fromCurrency) {
      return res.status(400).json({
        success: false,
        error: 'fromCurrency is required (e.g., USD, GBP, EUR)'
      });
    }

    if (!toCurrency) {
      return res.status(400).json({
        success: false,
        error: 'toCurrency is required (e.g., USD, GBP, EUR)'
      });
    }

    if (!amount) {
      return res.status(400).json({
        success: false,
        error: 'amount is required (e.g., 100, 1000)'
      });
    }

    // Convert to uppercase for consistency
    const sourceCurrency = fromCurrency.toUpperCase();
    const targetCurrency = toCurrency.toUpperCase();
    const sendAmount = parseFloat(amount);

    // Validate amount
    if (isNaN(sendAmount) || sendAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'amount must be a positive number'
      });
    }

    // Validate currencies exist in our data
    if (!validateCurrency(sourceCurrency)) {
      return res.status(400).json({
        success: false,
        error: `Invalid source currency: ${sourceCurrency}. Please use a valid currency code.`
      });
    }

    if (!validateCurrency(targetCurrency)) {
      return res.status(400).json({
        success: false,
        error: `Invalid target currency: ${targetCurrency}. Please use a valid currency code.`
      });
    }

    // Get currency details
    const sourceCurrencyDetails = getCurrencyDetails(sourceCurrency);
    const targetCurrencyDetails = getCurrencyDetails(targetCurrency);

    // Fetch comparison data from Wise API
    const comparisonData = await getWiseComparison(sourceCurrency, targetCurrency, sendAmount);

    // Format provider data
    let providers = formatProviderData(comparisonData.providers);

    // Also fetch SendWave rates and normalize to provider shape
    let sendWaveProvider = null;
    try {
      const sendCountryIso2 = getCountryIso2ByCurrency(sourceCurrency);
      const receiveCountryIso2 = getCountryIso2ByCurrency(targetCurrency);

      if (!sendCountryIso2 || !receiveCountryIso2) {
        console.warn(`SendWave lookup skipped: missing country mapping for ${!sendCountryIso2 ? sourceCurrency : targetCurrency}`);
      } else {
        const sendWaveData = await getSendWaveRates(
          sourceCurrency,
          targetCurrency,
          sendCountryIso2,
          receiveCountryIso2,
          sendAmount
        );
        sendWaveProvider = formatSendWaveProvider(sendWaveData, sendAmount, sourceCurrency, targetCurrency);
      }
    } catch (sendWaveErr) {
      console.warn('SendWave fetch failed:', sendWaveErr.message);
    }

    if (sendWaveProvider) {
      providers.push(sendWaveProvider);
    }

    // Filter by provider type if specified
    if (providerTypes) {
      const types = Array.isArray(providerTypes) ? providerTypes : [providerTypes];
      providers = providers.filter(p => types.includes(p.type));
    }

    // Sort by best received amount (descending)
    providers.sort((a, b) => b.receivedAmount - a.receivedAmount);

    // Calculate statistics
    const stats = {
      bestRate: providers[0],
      worstRate: providers[providers.length - 1],
      averageReceivedAmount: providers.reduce((sum, p) => sum + p.receivedAmount, 0) / providers.length,
      averageRate: providers.reduce((sum, p) => sum + p.rate, 0) / providers.length,
      totalProviders: providers.length,
      savingsWithBest: providers[providers.length - 1].receivedAmount - providers[0].receivedAmount
    };

    // Store history for authenticated users
    if (req.user && req.user._id) {
      recordRateHistory({
        userId: req.user._id,
        fromCurrency: sourceCurrency,
        toCurrency: targetCurrency,
        amount: sendAmount,
        stats,
        providers
      }).catch(err => {
        console.warn('Failed to record rate history:', err.message);
      });
    }

    res.json({
      success: true,
      query: {
        source: sourceCurrencyDetails,
        target: targetCurrencyDetails,
        sendAmount: sendAmount
      },
      stats,
      providers
    });

  } catch (err) {
    console.error('Error fetching rates comparison:', err);
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};



// Get specific provider details
exports.GetProviderRate = async (req, res) => {
  try {
    const { 
      fromCurrency,
      toCurrency,
      amount,
      provider
    } = req.query;

    // Validate required parameters
    if (!fromCurrency || !toCurrency || !amount || !provider) {
      return res.status(400).json({
        success: false,
        error: 'fromCurrency, toCurrency, amount, and provider are all required'
      });
    }

    // Convert to uppercase for consistency
    const sourceCurrency = fromCurrency.toUpperCase();
    const targetCurrency = toCurrency.toUpperCase();
    const sendAmount = parseFloat(amount);

    // Validate amount
    if (isNaN(sendAmount) || sendAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'amount must be a positive number'
      });
    }

    // Validate currencies
    if (!validateCurrency(sourceCurrency)) {
      return res.status(400).json({
        success: false,
        error: `Invalid source currency: ${sourceCurrency}`
      });
    }

    if (!validateCurrency(targetCurrency)) {
      return res.status(400).json({
        success: false,
        error: `Invalid target currency: ${targetCurrency}`
      });
    }

    // Get currency details
    const sourceCurrencyDetails = getCurrencyDetails(sourceCurrency);
    const targetCurrencyDetails = getCurrencyDetails(targetCurrency);

    // Fetch comparison data
    const comparisonData = await getWiseComparison(sourceCurrency, targetCurrency, sendAmount);
    const providerData = comparisonData.providers.find(p => p.alias === provider.toLowerCase());

    if (!providerData) {
      return res.status(404).json({
        success: false,
        error: `Provider '${provider}' not found`
      });
    }

    const formatted = formatProviderData([providerData])[0];

    res.json({
      success: true,
      query: {
        source: sourceCurrencyDetails,
        target: targetCurrencyDetails,
        sendAmount: sendAmount
      },
      provider: formatted
    });

  } catch (err) {
    console.error('Error fetching provider rate:', err);
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};



// Get all supported currencies
exports.GetSupportedCurrencies = (req, res) => {
  try {
    const currencies = countriesData.currencies.map(currency => ({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      countriesCount: currency.countries.length
    }));

    res.json({
      success: true,
      total: currencies.length,
      currencies: currencies
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};



// Get all countries
exports.GetAllCountries = (req, res) => {
  try {
    const { region } = req.query;

    let countries = countriesData.countries;

    // Filter by region if specified
    if (region) {
      countries = countries.filter(c => c.region.toLowerCase() === region.toLowerCase());
    }

    res.json({
      success: true,
      total: countries.length,
      countries: countries
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};



// Get countries by currency
exports.GetCountriesByCurrency = (req, res) => {
  try {
    const { currency } = req.params;

    if (!currency) {
      return res.status(400).json({
        success: false,
        error: 'Currency code is required'
      });
    }

    const currencyCode = currency.toUpperCase();

    if (!validateCurrency(currencyCode)) {
      return res.status(404).json({
        success: false,
        error: `Currency '${currencyCode}' not found`
      });
    }

    const currencyDetails = getCurrencyDetails(currencyCode);

    res.json({
      success: true,
      currency: currencyDetails
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};



// Get Wise Rates
exports.GetWiseRates = async (req, res) => {
  try {
    const { from = "CAD", to = "NGN", amount = 1 } = req.query;

    // Convert to uppercase
    const sourceCurrency = from.toUpperCase();
    const targetCurrency = to.toUpperCase();

    // Get currency details
    const sourceDetails = getCurrencyDetails(sourceCurrency);
    const targetDetails = getCurrencyDetails(targetCurrency);

    // Validate currencies
    if (!sourceDetails) {
      return res.status(400).json({
        success: false,
        error: `Invalid currency: ${from}`
      });
    }

    if (!targetDetails) {
      return res.status(400).json({
        success: false,
        error: `Invalid currency: ${to}`
      });
    }

    const rates = await getWiseRates(sourceCurrency, targetCurrency, amount);

    res.json({ 
      success: true,
      from: sourceDetails,
      to: targetDetails,
      amount: parseFloat(amount),
      rates 
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      success: false,
      error: err.response?.data || err.message
    });
  }
};




exports.GetSendWaveRates = async (req, res) => {
  try {
    const { 
      from = "USD", 
      to = "NGN", 
      amount = 100,
      fromCountry,
      toCountry
    } = req.query;

    // Convert to uppercase
    const sendCurrency = from.toUpperCase();
    const receiveCurrency = to.toUpperCase();
    const sendAmount = parseFloat(amount);

    // Validate amount
    if (isNaN(sendAmount) || sendAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'amount must be a positive number'
      });
    }

    // Get currency details
    const sourceDetails = getCurrencyDetails(sendCurrency);
    const targetDetails = getCurrencyDetails(receiveCurrency);

    // Validate currencies
    if (!sourceDetails) {
      return res.status(400).json({
        success: false,
        error: `Invalid currency: ${from}`
      });
    }

    if (!targetDetails) {
      return res.status(400).json({
        success: false,
        error: `Invalid currency: ${to}`
      });
    }

    // Get country ISO2 codes
    let sendCountryIso2 = fromCountry ? fromCountry.toUpperCase() : getCountryIso2ByCurrency(sendCurrency);
    let receiveCountryIso2 = toCountry ? toCountry.toUpperCase() : getCountryIso2ByCurrency(receiveCurrency);

    // Validate country codes
    if (!sendCountryIso2) {
      return res.status(400).json({
        success: false,
        error: `Could not determine country for currency ${sendCurrency}. Please provide fromCountry parameter.`
      });
    }

    if (!receiveCountryIso2) {
      return res.status(400).json({
        success: false,
        error: `Could not determine country for currency ${receiveCurrency}. Please provide toCountry parameter.`
      });
    }

    const rates = await getSendWaveRates(
      sendCurrency, 
      receiveCurrency, 
      sendCountryIso2, 
      receiveCountryIso2, 
      sendAmount
    );

    res.json({ 
      success: true,
      from: sourceDetails,
      to: targetDetails,
      amount: sendAmount,
      sendCountry: sendCountryIso2,
      receiveCountry: receiveCountryIso2,
      rates 
    });
  } catch (error) {
    console.error("SendWave API Error:", error.message);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch rates",
      message: error.message
    });
  }
};






exports.GetRevolutRates = async (req, res) => {
  try {
    const { from = "USD", to = "NGN", amount = 1 } = req.query;

    const rates = await getRevolutRates(from, to, amount);

    res.json({ success: true, rates });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      success: false,
      error: err.response?.data || err.message
    });
  }
};




exports.GetPaysendRates = async (req, res) => {
    try {
        const data = JSON.stringify({
            header: {
                request: {
                    id: `req_${Date.now()}`,
                    date: new Date().toISOString()
                },
                service: {
                    sync: true,
                    waitTime: "WaitFor2000"
                }
            },
            payload: {
                partner: {
                    identifier: "your_partner_identifier",
                    parameters: {}
                },
                tasks: [
                    {
                        type: "fx.rateGet.p2a",
                        payload: {
                            payinCurrency: "USD",
                            payoutCurrency: "NGN",
                            payoutAmount: "100",
                            payoutCountry: "NG"
                        }
                    }
                ]
            }
        });

        const config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'http://enterprise.sandbox.paysend.com/processing',
            headers: { 
                'Content-Type': 'application/json', 
                'Accept': 'application/json',
                'X-OPP-Signature': 'your_signature_key_here'
            },
            data: data
        };

        const response = await axios.request(config);
        
        res.json(response.data);
    } catch (error) {
        console.log("Full error:", error.response?.data);
        res.status(500).json({
            error: "Failed to fetch Paysend P2A rates",
            message: error.response?.data || error.message
        });
    }
};
