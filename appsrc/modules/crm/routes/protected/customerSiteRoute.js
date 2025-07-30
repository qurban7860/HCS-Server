const express = require('express');

const checkAuth = require('../../../../middleware/check-auth');
const roleCheck = require('../../../../middleware/role-check');
const verifyDelete = require('../../../../middleware/verifyDelete');
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');
const controllers = require('../../controllers');
const controller = controllers.customerSiteController;

const baseRouteForObject = `/customers/:customerId/sites`;

const router = express.Router();
router.use(checkAuth);

// - /api/1.0.0/crm/customers/sites/
router.get('/customers/sites/all', roleCheck, controller.getCustomerSites);

// - /api/1.0.0/crm/sites/search
router.get(`${baseRouteForObject}/search`, controller.searchCustomerSites);

// - /api/1.0.0/crm/sites/export
router.get(`${baseRouteForObject}/export`, controller.exportSitesJSONForCSV);

// - /api/1.0.0/crm/customers/:customerId/sites/:id
router.get(`${baseRouteForObject}/:id`, checkIDs(validate.customerIdAndId), controller.getCustomerSite);

// - /api/1.0.0/crm/customers/:customerId/sites/
router.get(`${baseRouteForObject}/`, checkIDs(validate.customerId), controller.getCustomerSites);

// - /api/1.0.0/crm/customers/:customerId/sites/
router.post(`${baseRouteForObject}/`, checkIDs(validate.customerId), controller.postCustomerSite);

// - /api/1.0.0/crm/customers/:customerId/sites/:id
router.patch(`${baseRouteForObject}/:id`, checkIDs(validate.customerIdAndId), verifyDelete, controller.patchCustomerSite);

// - /api/1.0.0/crm/customers/:customerId/sites/:id
router.delete(`${baseRouteForObject}/:id`, checkIDs(validate.customerIdAndId), controller.deleteCustomerSite);

module.exports = router;