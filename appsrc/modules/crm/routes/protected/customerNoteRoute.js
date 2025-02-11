const express = require('express');
const { check } = require('express-validator');

const checkAuth = require('../../../../middleware/check-auth');
const { Customer } = require('../../models');
const checkCustomerID = require('../../../../middleware/check-parentID')('customer', Customer);
const checkCustomer = require('../../../../middleware/check-customer');
const verifyDelete = require('../../../../middleware/verifyDelete');
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');
const controllers = require('../../controllers');
const controller = controllers.customerNoteController;

const router = express.Router();

//  - base route for module
// - /api/1.0.0/crm/customers

// - /api/1.0.0/crm/customers/:customerId/notes/
const baseRouteForObject = `/customers/:customerId/notes`;

router.use(checkAuth, checkCustomer);

// - /api/1.0.0/crm/customers/:customerId/notes/:id
router.get(`${baseRouteForObject}/:id`, checkIDs(validate.customerIdAndId), checkCustomerID, controller.getCustomerNote);

// - /api/1.0.0/crm/customers/:customerId/notes/
router.get(`${baseRouteForObject}/`, checkCustomerID, controller.getCustomerNotes);

// - /api/1.0.0/crm/customers/:customerId/notes/
router.post(`${baseRouteForObject}/`, checkIDs(validate.customerIdAndId), checkCustomerID, controller.postCustomerNote);

// - /api/1.0.0/crm/customers/:customerId/notes/:id
router.patch(`${baseRouteForObject}/:id`, checkIDs(validate.customerIdAndId), checkCustomerID, verifyDelete, controller.patchCustomerNote);

// - /api/1.0.0/crm/customers/:customerId/notes/:id
router.delete(`${baseRouteForObject}/:id`, checkIDs(validate.customerIdAndId), checkCustomerID, controller.deleteCustomerNote);

// - /api/1.0.0/crm/notes/search
router.get(`/notes/search`, controller.searchCustomerNotes);

module.exports = router;