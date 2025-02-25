const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');
const customerDataFilter = require('../../../../middleware/customer-data-filter');
const controllers = require('../../../crm/controllers');
const controller = controllers.customerController;
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');
const router = express.Router();

//  - base route for module
// - /api/1.0.0/cp/crm/
const baseRouteForObject = `/customers`;

router.use(checkAuth, customerDataFilter);

// - /api/1.0.0/cp/crm/customers/
// router.get(`${baseRouteForObject}/`, controller.getCustomers);

// - /api/1.0.0/cp/crm/customers/:id
router.get(`${baseRouteForObject}/:id`, checkIDs(validate.id), controller.getCustomer);


module.exports = router; 