const express = require('express');
const { check } = require('express-validator');

const checkAuth = require('../../../../middleware/check-auth');
const roleCheck = require('../../../../middleware/role-check');
const { Customer } = require('../../models');
const checkCustomerID = require('../../../../middleware/check-parentID')('customer', Customer);
const checkCustomer = require('../../../../middleware/check-customer');
const verifyDelete = require('../../../../middleware/verifyDelete');
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');
const controllers = require('../../controllers');
const controller = controllers.customerSiteController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/crm/customers

// - /api/1.0.0/crm/customers/:customerId/sites 
const baseRouteForObject = `/customers/:customerId/sites`;

// EndPoint: {{baseUrl}}/crm/customers/:customerId/sites/:id
// localhost://api/1.0.0/crm/customers/:customerId/sites 
//localhost://api/1.0.0/crm/search/sites

router.use(checkAuth, roleCheck, checkCustomer);


//// - /api/1.0.0/crm/sites/search
router.get(`${baseRouteForObject}/search`, controller.searchCustomerSites);

// - /api/1.0.0/crm/sites/export
router.get(`${baseRouteForObject}/export`, controller.exportSitesJSONForCSV);

// - /api/1.0.0/crm/customers/:customerId/sites/:id
router.get(`${baseRouteForObject}/:id`, checkIDs(validate.customerIdAndId), checkCustomerID, controller.getCustomerSite);

// - /api/1.0.0/crm/customers/:customerId/sites/
router.get(`${baseRouteForObject}/`, controller.getCustomerSites);

// - /api/1.0.0/crm/customers/:customerId/sites/
router.post(`${baseRouteForObject}/`, checkIDs(validate.customerId), checkCustomerID, controller.postCustomerSite);

// - /api/1.0.0/crm/customers/:customerId/sites/:id
router.patch(`${baseRouteForObject}/:id`, checkIDs(validate.customerIdAndId), checkCustomerID, verifyDelete, controller.patchCustomerSite);

// - /api/1.0.0/crm/customers/:customerId/sites/:id
router.delete(`${baseRouteForObject}/:id`, checkIDs(validate.customerIdAndId), checkCustomerID, controller.deleteCustomerSite);



module.exports = router;