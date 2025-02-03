const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');
const checkCustomer = require('../../../../middleware/check-customer');
const customerDataFilter = require('../../../../middleware/customer-data-filter');
const controllers = require('../../../products/controllers');
const controller = controllers.productModelController;

const router = express.Router();

const baseRouteForObject = `/models`; 

router.use(checkAuth, checkCustomer, customerDataFilter);

router.get(`${baseRouteForObject}/:id`, controller.getProductModel);
router.get(`${baseRouteForObject}/`, controller.getProductModels);

module.exports = router; 