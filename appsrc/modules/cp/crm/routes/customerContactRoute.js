const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');
const customerDataFilter = require('../../../../middleware/customer-data-filter');
const controllers = require('../../../crm/controllers');
const controller = controllers.customerContactController;
const checkIDs = require('../../../../middleware/validateParamIDs');
const validateCustomerInRequest = require('../../../../middleware/validateCustomerInRequest');
const validate = require('../../utils/validate');
const router = express.Router();

// - /api/1.0.0/cp/crm/customers/:customerId/contacts
const baseRoute = `/customers/:customerId/contacts`;

router.use(checkAuth, customerDataFilter);

// - /api/1.0.0/cp/crm/customers/:customerId/contacts/:id
router.get(`${baseRoute}/:id`, checkIDs(validate.customerIdAndId), controller.getCustomerContact);

// - /api/1.0.0/cp/crm/customers/:customerId/contacts/
router.get(`${baseRoute}/`, checkIDs(validate.customerId), controller.getCustomerContacts);

// - /api/1.0.0/cp/crm/customers/:customerId/contacts/
router.post(`${baseRoute}/`, checkIDs(validate.customerId), validateCustomerInRequest, controller.postCustomerContact);

// - /api/1.0.0/cp/crm/customers/:customerId/contacts/:id
router.patch(`${baseRoute}/:id`, checkIDs(validate.customerIdAndId), validateCustomerInRequest, controller.patchCustomerContact);

module.exports = router; 