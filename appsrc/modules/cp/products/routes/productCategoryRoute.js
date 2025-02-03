const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');
const checkCustomer = require('../../../../middleware/check-customer');
const customerDataFilter = require('../../../../middleware/customer-data-filter');
const controllers = require('../../../products/controllers');
const controller = controllers.productCategoryController;

const router = express.Router();

const baseRouteForObject = `/categories`; 

router.use(checkAuth, checkCustomer, customerDataFilter);

router.get(`${baseRouteForObject}/`, controller.getProductCategories);

module.exports = router; 