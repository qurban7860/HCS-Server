const express = require('express');
const { check } = require('express-validator');

const checkAuth = require('../../../middleware/check-auth');
const verifyDelete = require('../../../middleware/verifyDelete');
const checkIDs = require('../../../middleware/validateParamIDs');
const validate = require('../utils/validate');

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
router.get(`${baseRoute}/:id`, checkIDs(validate.id), controller.getSecurityConfigBlockedCustomer);

// - /api/1.0.0/security/configs/blockedcustomers
router.get(`${baseRoute}/`, controller.getSecurityConfigBlockedCustomers);

// - /api/1.0.0/security/configs/blockedcustomers
router.post(`${baseRoute}/`, controller.postSecurityConfigBlockedCustomer);

// - /api/1.0.0/security/configs/blockedcustomers/:id
router.patch(`${baseRoute}/:id`, checkIDs(validate.id), verifyDelete, controller.patchSecurityConfigBlockedCustomer);

// - /api/1.0.0/security/configs/blockedcustomers/:id
router.delete(`${baseRoute}/:id`, checkIDs(validate.id), controller.deleteSecurityConfigBlockedCustomer);

// - /api/1.0.0/security/configs/blockedcustomers/search

module.exports = router;