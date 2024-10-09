const express = require('express');

const checkAuth = require('../../../middleware/check-auth');
const roleCheck = require('../../../middleware/role-check');
const verifyDelete = require('../../../middleware/verifyDelete');

const controllers = require('../controllers');
const controller = controllers.customerRegistration;

const router = express.Router();

//  - base route for module
// - /api/1.0.0/crm/
const baseRouteForObject = "/customers/register"; 

// - /api/1.0.0/crm/customers/register/
router.get(`${baseRouteForObject}`, checkAuth, controller.getRegisteredCustomers);

// - /api/1.0.0/crm/customers/register/:id
router.get(`${baseRouteForObject}/:id`, controller.getRegisteredCustomer);

// - /api/1.0.0/crm/customers/register/
router.post(`${baseRouteForObject}/`, checkAuth, controller.postRegisterCustomer);

// - /api/1.0.0/crm/customers/register/:id
router.patch(`${baseRouteForObject}/:id`, checkAuth, verifyDelete, roleCheck, controller.patchRegisteredCustomer);

// - /api/1.0.0/crm/customers/register/:id
router.delete(`${baseRouteForObject}/:id`, controller.deleteRegisteredCustomer);


module.exports = router;