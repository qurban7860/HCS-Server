const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const { Customer } = require('../models');
const checkCustomerID = require('../../../middleware/check-parentID')('customer', Customer);
const verifyDelete = require('../../../middleware/verifyDelete');


const controllers = require('../controllers');
const controller = controllers.customerContactController;

const router = express.Router();

//  - base route for module
// - /api/1.0.0/crm/customers

// - /api/1.0.0/crm/customers/:customerId/contacts
const baseRoute = `/customers/:customerId/contacts`;

router.use(checkAuth, checkCustomer);

// - /api/1.0.0/crm/customers/:customerId/contacts/:id
router.get(`${baseRoute}/:id`, checkCustomerID, controller.getCustomerContact);

// - /api/1.0.0/crm/customers/:customerId/contacts/
router.get(`${baseRoute}/`, checkCustomerID, controller.getCustomerContacts);

// - /api/1.0.0/crm/customers/:customerId/contacts/
router.post(`${baseRoute}/`, checkCustomerID, controller.postCustomerContact);

// - /api/1.0.0/crm/customers/:customerId/contacts/:id
router.patch(`${baseRoute}/:id`, checkCustomerID, verifyDelete, controller.patchCustomerContact);

// - /api/1.0.0/crm/customers/:customerId/contacts/:id
router.delete(`${baseRoute}/:id`, checkCustomerID, controller.deleteCustomerContact);

// - /api/1.0.0/crm/contacts/search
router.get(`/contacts/search`, controller.searchCustomerContacts);


// - /api/1.0.0/crm/sp/contacts
router.get(`/sp/contacts`, controller.getSPCustomerContacts);



module.exports = router;