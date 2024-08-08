const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../../../middleware/check-auth');
const verifyDelete = require('../../../middleware/verifyDelete');
const controllers = require('../controllers');
const controller = controllers.securityConfigBlockedUserController;
const checkCustomer = require('../../../middleware/check-customer');

const router = express.Router();

const baseRoute = `/configs/blockedusers`;

router.use(checkAuth, checkCustomer);

router.get(`${baseRoute}/search`, controller.searchSecurityConfigBlockedUser);

// - /api/1.0.0/security/configs/blockedusers/:id
router.get(`${baseRoute}/:id`, controller.getsecurityConfigBlockedUser);

// - /api/1.0.0/security/configs/blockedusers
router.get(`${baseRoute}/`, controller.getSecurityConfigBlockedUsers);

// - /api/1.0.0/security/configs/blockedusers
router.post(`${baseRoute}/`, controller.postSecurityConfigBlockedUser);

// - /api/1.0.0/security/configs/blockedusers/:id
router.patch(`${baseRoute}/:id`, verifyDelete, controller.patchSecurityConfigBlockedUser);

// - /api/1.0.0/security/configs/blockedusers/:id
router.delete(`${baseRoute}/:id`, controller.deleteSecurityConfigBlockedUser);

// - /api/1.0.0/security/configs/blockedusers/search

module.exports = router;