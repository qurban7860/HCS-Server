const express = require('express');
const { check } = require('express-validator');

const checkAuth = require('../../../../middleware/check-auth');
const roleCheck = require('../../../../middleware/role-check');
const checkCustomer = require('../../../../middleware/check-customer');
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');
const verifyDelete = require('../../../../middleware/verifyDelete');


const controllers = require('../../controllers');
const controller = controllers.customerContactController;

const router = express.Router();

// - /api/1.0.0/crm/customers/:customerId/contacts
const baseRoute = `/customers/:customerId/contacts`;

router.use(checkAuth, roleCheck);

// - /api/1.0.0/crm/contacts/search
router.get(`${baseRoute}/search`, controller.searchCustomerContacts);

// - /api/1.0.0/crm/contacts/export
router.get(`${baseRoute}/export`, controller.exportContactsJSONForCSV);

// - /api/1.0.0/crm/customers/:customerId/contacts/:id
router.get(`${baseRoute}/:id`, checkIDs(validate.customerIdAndId), controller.getCustomerContact);

// - /api/1.0.0/crm/customers/:customerId/contacts/
router.get(`${baseRoute}/`, controller.getCustomerContacts);

// - /api/1.0.0/crm/customers/:customerId/contacts/
router.post(`${baseRoute}/`, checkIDs(validate.customerId), controller.postCustomerContact);

// - /api/1.0.0/crm/customers/:customerId/contacts/:id
router.patch(`${baseRoute}/:id`, checkIDs(validate.customerIdAndId), verifyDelete, controller.patchCustomerContact);

// - /api/1.0.0/crm/customers/:customerId/contacts/:id
router.delete(`${baseRoute}/:id`, checkIDs(validate.customerIdAndId), controller.deleteCustomerContact);

// - /api/1.0.0/crm/sp/contacts
router.get(`/sp/contacts`, controller.getSPCustomerContacts);

// - /api/1.0.0/crm/customers/:customerId/contacts/
router.post(`${baseRoute}/moveContact`, checkIDs(validate.customerId), controller.moveContact);

module.exports = router;