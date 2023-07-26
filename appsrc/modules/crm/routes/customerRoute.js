const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const verifyDelete = require('../../../middleware/verifyDelete');

const controllers = require('../controllers');
const controller = controllers.customerController;

const router = express.Router();

//  - base route for module
// - /api/1.0.0/crm/
const baseRouteForObject = `/customers`; 


router.use(checkAuth, checkCustomer);

// - /api/1.0.0/crm/customers/get/:flag/:id
router.get(`${baseRouteForObject}/:id`, controller.getCustomer);

// - /api/1.0.0/crm/customers/
router.get(`${baseRouteForObject}/`, controller.getCustomers);

// - /api/1.0.0/crm/customers/
router.post(`${baseRouteForObject}/`, controller.postCustomer);

// - /api/1.0.0/crm/customers/:id
router.patch(`${baseRouteForObject}/:id`, verifyDelete, controller.patchCustomer);

// - /api/1.0.0/crm/customers/:id
router.delete(`${baseRouteForObject}/:id`, controller.deleteCustomer);

// - /api/1.0.0/crm/customers/getRegionCustomers
router.get(`/getCustomersAgainstCountries`, controller.getCustomersAgainstCountries);

// - /api/1.0.0/crm/customers/search
// router.get(`/customers/search`, controller.searchCustomers);


module.exports = router;