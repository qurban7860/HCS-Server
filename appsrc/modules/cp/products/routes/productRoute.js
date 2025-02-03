const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');
const roleCheck = require('../../../../middleware/role-check');
const checkCustomer = require('../../../../middleware/check-customer');
const customerDataFilter = require('../../../../middleware/customer-data-filter');
const controllers = require('../../../products/controllers');
const controller = controllers.productController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/cp/products/machines

const baseRouteForObject = `/machines`; 

router.use(checkAuth, roleCheck, checkCustomer, customerDataFilter);

router.get(`${baseRouteForObject}/`, controller.getProducts);
router.get(`${baseRouteForObject}/:id`, controller.getProduct);

module.exports = router; 