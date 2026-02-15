const express = require("express");
const { Getrates, GetPaysendRates, GetRevolutRates, GetWiseRates, GetRatesComparison, GetProviderRate, GetSupportedCurrencies, GetAllCountries, GetCountryByCode, GetCountriesByCurrency, GetSendWaveRates } = require("../controllers/rates/rate.controller");
const { optionalAuth } = require('../helpers/authService');

const router = express.Router();




router.get('/rates/compare', optionalAuth, GetRatesComparison);
router.get('/rates/provider', GetProviderRate);

router.get('/currencies', GetSupportedCurrencies);
router.get('/countries', GetAllCountries);
router.get('/currencies/:currency/countries', GetCountriesByCurrency);

router.get("/rates/sendwave",GetSendWaveRates);
router.get("/rates/wise", GetWiseRates);


router.get("/rates/paysend", GetPaysendRates);
router.get("/rates/revolut", GetRevolutRates);





module.exports = router;
