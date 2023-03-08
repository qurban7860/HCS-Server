const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const { Customer } = require('../models');
const checkCustomerID = require('../../../middleware/check-parentID')('customer', Customer);



const controllers = require('../controllers');
const controller = controllers.customerContactController;

const router = express.Router();

//  - base route for module
// - /api/1.0.0/crm/customers

const baseRoute = `/customers/:customerId/contacts`;
// - /api/1.0.0/crm/customers/:customerId/contacts

router.use(checkAuth);

// - /api/1.0.0/crm/customers/:customerId/contacts/:id
router.get(`${baseRoute}/:id`, checkCustomerID,controller.getCustomerContact);

// - /api/1.0.0/crm/customers/:customerId/contacts/
router.get(`${baseRoute}/`, checkCustomerID, controller.getCustomerContacts);

// - /api/1.0.0/crm/customers/:customerId/contacts/
router.post(`${baseRoute}/`, checkCustomerID,controller.postCustomerContact);

// - /api/1.0.0/crm/customers/:customerId/contacts/:id
router.patch(`${baseRoute}/:id`, checkCustomerID, controller.patchCustomerContact);

// - /api/1.0.0/crm/customers/:customerId/contacts/:id
router.delete(`${baseRoute}/:id`, checkCustomerID, controller.deleteCustomerContact);

// - /api/1.0.0/crm/contacts/search
router.get(`/contacts/search`, controller.searchCustomerContacts);


module.exports = router;