const countriesData = require('../../src/utils/countriesCurrencies.json');

// Helper function to get country by currency code
function getCountryByCurrency(currencyCode) {
  return countriesData.countries.find(c => c.currency === currencyCode);
}

// Helper function to get all countries using a specific currency
function getCountriesByCurrency(currencyCode) {
  return countriesData.countries.filter(c => c.currency === currencyCode);
}

// Helper function to validate currency
function validateCurrency(currencyCode) {
  const currency = countriesData.currencies.find(c => c.code === currencyCode);
  return currency !== undefined;
}

// Helper function to get currency details
function getCurrencyDetails(currencyCode) {
  const currency = countriesData.currencies.find(c => c.code === currencyCode);
  if (!currency) return null;
  
  const countries = getCountriesByCurrency(currencyCode);
  
  return {
    code: currency.code,
    name: currency.name,
    symbol: currency.symbol,
    countries: countries.map(c => ({
      code: c.code,
      name: c.name,
      flag: c.flag,
      flagUrl: c.flagUrl,
      flagSvg: c.flagSvg,
      region: c.region
    }))
  };
}

function getCountryIso2ByCurrency(currencyCode) {
  const country = countriesData.countries.find(c => c.currency === currencyCode);
  return country ? country.code : null;
}



// Helper function to format provider data
function formatProviderData(providers) {
  return providers.map(provider => {
    // Get the best quote (typically the first one with best rate)
    const bestQuote = provider.quotes.reduce((best, current) => {
      return current.receivedAmount > best.receivedAmount ? current : best;
    }, provider.quotes[0]);

    return {
      id: provider.id,
      name: provider.name,
      alias: provider.alias,
      type: provider.type,
      logo: provider.logos.normal.svgUrl || provider.logos.normal.pngUrl,
      rate: bestQuote.rate,
      fee: bestQuote.fee,
      receivedAmount: bestQuote.receivedAmount,
      sendAmount: bestQuote.sendAmount,
      markup: bestQuote.markup,
      deliveryTime: bestQuote.deliveryEstimation,
      isMidMarketRate: bestQuote.isConsideredMidMarketRate,
      sourceCountry: bestQuote.sourceCountry,
      targetCountry: bestQuote.targetCountry,
      dateCollected: bestQuote.dateCollected
    };
  });
}

module.exports = {
  getCountryByCurrency,
  getCountriesByCurrency,
  validateCurrency,
  getCurrencyDetails,
  formatProviderData,
  getCountryIso2ByCurrency,
  countriesData
};