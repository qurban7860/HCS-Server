const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../../../../middleware/check-auth');
const roleCheck = require('../../../../middleware/role-check');
const checkCustomer = require('../../../../middleware/check-customer');
const { Customer } = require('../../../crm/models');
const checkCustomerID = require('../../../../middleware/check-parentID')('customer', Customer);
const customerDataFilter = require('../../../../middleware/customer-data-filter');
const controllers = require('../../../crm/controllers');
const controller = controllers.customerContactController;

const router = express.Router();

//  - base route for module
// - /api/1.0.0/cp/crm/customers

// - /api/1.0.0/cp/crm/customers/:customerId/contacts
const baseRoute = `/customers/:customerId/contacts`;

router.use(checkAuth, roleCheck, checkCustomer, customerDataFilter);

// - /api/1.0.0/cp/crm/customers/:customerId/contacts/:id
router.get(`${baseRoute}/:id`, checkCustomerID, controller.getCustomerContact);

// - /api/1.0.0/cp/crm/customers/:customerId/contacts/
router.get(`${baseRoute}/`, controller.getCustomerContacts);

module.exports = router; 