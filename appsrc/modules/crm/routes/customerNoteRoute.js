const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const { Customer } = require('../models');
const checkCustomerID = require('../../../middleware/check-parentID')('customer', Customer);
const checkCustomer = require('../../../middleware/check-customer');
const verifyDelete = require('../../../middleware/verifyDelete');

const controllers = require('../controllers');
const controller = controllers.customerNoteController;

const router = express.Router();

//  - base route for module
// - /api/1.0.0/crm/customers

// - /api/1.0.0/crm/customers/:customerId/notes/
const baseRouteForObject = `/customers/:customerId/notes`;

router.use(checkAuth, checkCustomer);

// - /api/1.0.0/crm/customers/:customerId/notes/:id
router.get(`${baseRouteForObject}/:id`, checkCustomerID, controller.getCustomerNote);

// - /api/1.0.0/crm/customers/:customerId/notes/
router.get(`${baseRouteForObject}/`, checkCustomerID, controller.getCustomerNotes);

// - /api/1.0.0/crm/customers/:customerId/notes/
router.post(`${baseRouteForObject}/`, checkCustomerID, controller.postCustomerNote);

// - /api/1.0.0/crm/customers/:customerId/notes/:id
router.patch(`${baseRouteForObject}/:id`, checkCustomerID, verifyDelete, controller.patchCustomerNote);

// - /api/1.0.0/crm/customers/:customerId/notes/:id
router.delete(`${baseRouteForObject}/:id`, checkCustomerID, controller.deleteCustomerNote);

// - /api/1.0.0/crm/notes/search
router.get(`/notes/search`, controller.searchCustomerNotes);

module.exports = router;