const express = require('express');
const { check } = require('express-validator');

const checkAuth = require('../../../../middleware/check-auth');
const roleCheck = require('../../../../middleware/role-check');
const verifyDelete = require('../../../../middleware/verifyDelete');
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');
const controllers = require('../../controllers');
const controller = controllers.customerController;

const router = express.Router();

//  - base route for module
// - /api/1.0.0/crm/
const baseRouteForObject = `/customers`;


router.use(checkAuth, roleCheck);

// - /api/1.0.0/crm/sites/export
router.get(`${baseRouteForObject}/export`, controller.exportCustomersJSONForCSV);

// - /api/1.0.0/crm/customers/get/:flag/:id
router.get(`${baseRouteForObject}/:id`, checkIDs(validate.idAndCustomer), controller.getCustomer);

// - /api/1.0.0/crm/customers/
router.get(`${baseRouteForObject}/`, controller.getCustomers);

// - /api/1.0.0/crm/customers/
router.post(`${baseRouteForObject}/`, controller.postCustomer);

// - /api/1.0.0/crm/customers/:id
router.patch(`${baseRouteForObject}/:id`, checkIDs(validate.idAndCustomer), verifyDelete, controller.patchCustomer);

// - /api/1.0.0/crm/customers/:id
router.delete(`${baseRouteForObject}/:id`, checkIDs(validate.idAndCustomer), controller.deleteCustomer);

// - /api/1.0.0/crm/customers/getRegionCustomers
router.get(`/getCustomersAgainstCountries`, controller.getCustomersAgainstCountries);

// - /api/1.0.0/crm/customers/search
// router.get(`/customers/search`, controller.searchCustomers);


module.exports = router;