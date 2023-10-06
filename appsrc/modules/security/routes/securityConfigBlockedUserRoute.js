const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const verifyDelete = require('../../../middleware/verifyDelete');
// const { Customer } = require('../models');
// const checkCustomerID = require('../../../middleware/check-parentID')('customer', Customer);



const controllers = require('../controllers');
const controller = controllers.securityConfigBlockedUserController;
const checkCustomer = require('../../../middleware/check-customer');

const router = express.Router();

//  - base route for module
// - /api/1.0.0/security/configs/blockedusers

const baseRoute = `/configs/blockedusers`;

router.use(checkAuth, checkCustomer);

router.get(`${baseRoute}/search`, controller.searchSecurityConfigUser);

// - /api/1.0.0/security/configs/blockedusers/:id
router.get(`${baseRoute}/:id`, controller.getsecurityConfigUser);

// - /api/1.0.0/security/configs/blockedusers
router.get(`${baseRoute}/`, controller.getSecurityConfigUsers);

// - /api/1.0.0/security/configs/blockedusers
router.post(`${baseRoute}/`, controller.postSecurityConfigUser);

// - /api/1.0.0/security/configs/blockedusers/:id
router.patch(`${baseRoute}/:id`, verifyDelete, controller.patchSecurityConfigUser);

// - /api/1.0.0/security/configs/blockedusers/:id
router.delete(`${baseRoute}/:id`, controller.deleteSecurityConfigUser);

// - /api/1.0.0/security/configs/blockedusers/search

module.exports = router;