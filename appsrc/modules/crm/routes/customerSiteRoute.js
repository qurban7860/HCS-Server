const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const { Customer } = require('../models');
const checkCustomerID = require('../../../middleware/check-parentID')('customer', Customer);
const checkCustomer = require('../../../middleware/check-customer');
const verifyDelete = require('../../../middleware/verifyDelete');

const controllers = require('../controllers');
const controller = controllers.customerSiteController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/crm/customers

// - /api/1.0.0/crm/customers/:customerId/sites 
const baseRouteForObject = `/customers/:customerId/sites`; 

// EndPoint: {{baseUrl}}/crm/customers/:customerId/sites/:id
// localhost://api/1.0.0/crm/customers/:customerId/sites 
//localhost://api/1.0.0/crm/search/sites

router.use(checkAuth, checkCustomer);


// - /api/1.0.0/crm/customers/:customerId/sites/:id
router.get(`${baseRouteForObject}/:id`, checkCustomerID, controller.getCustomerSite);

// - /api/1.0.0/crm/customers/:customerId/sites/
router.get(`${baseRouteForObject}/`, checkCustomerID, controller.getCustomerSites);

// - /api/1.0.0/crm/customers/:customerId/sites/
router.post(`${baseRouteForObject}/`, checkCustomerID, controller.postCustomerSite);

// - /api/1.0.0/crm/customers/:customerId/sites/:id
router.patch(`${baseRouteForObject}/:id`, checkCustomerID, verifyDelete, controller.patchCustomerSite);

// - /api/1.0.0/crm/customers/:customerId/sites/:id
router.delete(`${baseRouteForObject}/:id`, checkCustomerID, controller.deleteCustomerSite);

//// - /api/1.0.0/crm/sites/search
router.get(`/sites/search`, controller.searchCustomerSites);

module.exports = router;