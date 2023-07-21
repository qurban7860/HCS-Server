const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../../../middleware/check-auth');
const { Region } = require('../models');
const checkCustomer = require('../../../middleware/check-customer');
const controllers = require('../controllers');
const controller = controllers.countryController;
const verifyDelete = require('../../../middleware/verifyDelete');

const router = express.Router();

//  - base route for module
// - /api/1.0.0/regions/countries

const baseRouteForObject = `/countries`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}/:id`, controller.getCountry);

router.get(`${baseRouteForObject}/`, controller.getCountries);

router.post(`${baseRouteForObject}`, controller.postCountry);

router.patch(`${baseRouteForObject}/:id`, verifyDelete, controller.patchCountry);

router.delete(`${baseRouteForObject}/:id`, controller.deleteCountry);

module.exports = router;