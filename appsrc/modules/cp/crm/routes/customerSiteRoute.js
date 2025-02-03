const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../../../../middleware/check-auth');
const roleCheck = require('../../../../middleware/role-check');
const { Customer } = require('../../../crm/models');
const checkCustomerID = require('../../../../middleware/check-parentID')('customer', Customer);
const checkCustomer = require('../../../../middleware/check-customer');
const customerDataFilter = require('../../../../middleware/customer-data-filter');
const controllers = require('../../../crm/controllers');
const controller = controllers.customerSiteController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/cp/crm/customers

// - /api/1.0.0/cp/crm/customers/:customerId/sites 
const baseRouteForObject = `/customers/:customerId/sites`; 

router.use(checkAuth, roleCheck, checkCustomer, customerDataFilter);

// - /api/1.0.0/cp/crm/customers/:customerId/sites/:id
router.get(`${baseRouteForObject}/:id`, checkCustomerID, controller.getCustomerSite);

// - /api/1.0.0/cp/crm/customers/:customerId/sites/
router.get(`${baseRouteForObject}/`, controller.getCustomerSites);

module.exports = router; 