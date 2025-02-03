const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../../../../middleware/check-auth');
const roleCheck = require('../../../../middleware/role-check');
const checkCustomer = require('../../../../middleware/check-customer');
const customerDataFilter = require('../../../../middleware/customer-data-filter');
const controllers = require('../../../crm/controllers');
const controller = controllers.customerController;

const router = express.Router();

//  - base route for module
// - /api/1.0.0/cp/crm/
const baseRouteForObject = `/customers`; 

router.use(checkAuth, checkCustomer, roleCheck, customerDataFilter);

// - /api/1.0.0/cp/crm/customers/:id
router.get(`${baseRouteForObject}/:id`, controller.getCustomer);

// - /api/1.0.0/cp/crm/customers/
router.get(`${baseRouteForObject}/`, controller.getCustomers);

module.exports = router; 