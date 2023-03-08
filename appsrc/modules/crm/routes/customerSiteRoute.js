const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomerID = require('../../../middleware/check-parentID')('customer');

const controllers = require('../controllers');
const controller = controllers.customerSiteController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/crm/customers

const baseRouteForObject = `/:customerId/sites`; 
// - /api/1.0.0/crm/customers/:customerId/sites 

// EndPoint: {{baseUrl}}/crm/customers/:customerId/sites/:id
// localhost://api/1.0.0/crm/customers/:customerId/sites 
//localhost://api/1.0.0/crm/search/sites

router.use(checkAuth);


// - /api/1.0.0/crm/customers/:customerId/sites/:id
router.get(`${baseRouteForObject}/:id`, checkCustomerID, controller.getCustomerSite);

// - /api/1.0.0/crm/customers/:customerId/sites/
router.get(`${baseRouteForObject}/`, checkCustomerID, controller.getCustomerSites);

// - /api/1.0.0/crm/customers/:customerId/sites/
router.post(`${baseRouteForObject}/`, checkCustomerID,  controller.postCustomerSite);

// - /api/1.0.0/crm/customers/:customerId/sites/:id
router.patch(`${baseRouteForObject}/:id`, checkCustomerID,  controller.patchCustomerSite);

// - /api/1.0.0/crm/customers/:customerId/sites/:id
router.delete(`${baseRouteForObject}/:id`, checkCustomerID, controller.deleteCustomerSite);

//// - /api/1.0.0/crm/customers/sites/
//router.get(`/sites/`, controller.searchCustomerSites);

module.exports = router;