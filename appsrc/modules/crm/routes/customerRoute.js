const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');

const controllers = require('../controllers');
const controller = controllers.customerController;

const router = express.Router();

//  - base route for module
// - /api/1.0.0/crm/
const baseRouteForObject = `/customers`; 


// router.use(checkAuth);

// - /api/1.0.0/crm/customers/:id
router.get(`${baseRouteForObject}/:id`, controller.getCustomer);

// - /api/1.0.0/crm/customers/
router.get(`${baseRouteForObject}/`, controller.getCustomers);

// - /api/1.0.0/crm/customers/
router.post(`${baseRouteForObject}/`,  controller.postCustomer);

// - /api/1.0.0/crm/customers/:id
router.patch(`${baseRouteForObject}/:id`,  controller.patchCustomer);

// - /api/1.0.0/crm/customers/:id
router.delete(`${baseRouteForObject}/:id`, controller.deleteCustomer);

// - /api/1.0.0/crm/customers/search
// router.get(`/customers/search`, controller.searchCustomers);


module.exports = router;