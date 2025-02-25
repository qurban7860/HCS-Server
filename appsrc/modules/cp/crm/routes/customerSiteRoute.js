const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');
const customerDataFilter = require('../../../../middleware/customer-data-filter');
const controllers = require('../../../crm/controllers');
const controller = controllers.customerSiteController;
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');
const router = express.Router();

router.use(checkAuth, customerDataFilter);

// - /api/1.0.0/cp/crm/customers/:customerId/sites 
const baseRouteForObject = `/customers/:customerId/sites`;

// - /api/1.0.0/cp/crm/customers/:customerId/sites/:id
router.get(`${baseRouteForObject}/:id`, checkIDs(validate.customerIdAndId), controller.getCustomerSite);

// - /api/1.0.0/cp/crm/customers/:customerId/sites/
router.get(`${baseRouteForObject}/`, checkIDs(validate.customerId), controller.getCustomerSites);

// // - /api/1.0.0/cp/crm/customers/:customerId/sites/
// router.post(`${baseRouteForObject}/`, checkIDs(validate.customerId), controller.postCustomerSite);

// // - /api/1.0.0/cp/crm/customers/:customerId/sites/:id
// router.patch(`${baseRouteForObject}/:id`, checkIDs(validate.customerIdAndId), controller.patchCustomerSite);

module.exports = router; 