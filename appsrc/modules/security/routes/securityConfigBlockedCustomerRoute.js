const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const verifyDelete = require('../../../middleware/verifyDelete');
// const { Customer } = require('../models');
// const checkCustomerID = require('../../../middleware/check-parentID')('customer', Customer);



const controllers = require('../controllers');
const controller = controllers.securityConfigBlockedCustomerController;
const checkCustomer = require('../../../middleware/check-customer');

const router = express.Router();

//  - base route for module
// - /api/1.0.0/security/configs/blockedcustomers

const baseRoute = `/configs/blockedcustomers`;

router.use(checkAuth, checkCustomer);

router.get(`${baseRoute}/search`, controller.searchSecurityConfigBlockedCustomer);

// - /api/1.0.0/security/configs/blockedcustomers/:id
router.get(`${baseRoute}/:id`, controller.getSecurityConfigBlockedCustomer);

// - /api/1.0.0/security/configs/blockedcustomers
router.get(`${baseRoute}/`, controller.getSecurityConfigBlockedCustomers);

// - /api/1.0.0/security/configs/blockedcustomers
router.post(`${baseRoute}/`, controller.postSecurityConfigBlockedCustomer);

// - /api/1.0.0/security/configs/blockedcustomers/:id
router.patch(`${baseRoute}/:id`, verifyDelete, controller.patchSecurityConfigBlockedCustomer);

// - /api/1.0.0/security/configs/blockedcustomers/:id
router.delete(`${baseRoute}/:id`, controller.deleteSecurityConfigBlockedCustomer);

// - /api/1.0.0/security/configs/blockedcustomers/search

module.exports = router;