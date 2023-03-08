const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');

const controllers = require('../controllers');

const router = express.Router();

//  - base route for module
// localhost://api/1.0.0/crm/search
const baseRouteForObject = ``; 


router.use(checkAuth);

// - /api/1.0.0/crm/search/customers
router.get(`${baseRouteForObject}/customers`, controllers.customerController.getCustomers);

// - /api/1.0.0/crm/search/sites
router.get(`${baseRouteForObject}/sites`, controllers.customerSiteController.searchCustomerSites);

// - /api/1.0.0/crm/search/contacts
router.get(`${baseRouteForObject}/contacts`, controllers.customerContactController.searchCustomerContacts);

// - /api/1.0.0/crm/search/notes
router.get(`${baseRouteForObject}/notes`, controllers.customerNoteController.searchCustomerNotes);


module.exports = router;