const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../../../middleware/check-auth');
const verifyDelete = require('../../../middleware/verifyDelete');
const controllers = require('../controllers');
const controller = controllers.securityConfigBlackListIPController;
const checkCustomer = require('../../../middleware/check-customer');

const router = express.Router();

const baseRoute = `/configs/Blacklistips`;

router.use(checkAuth, checkCustomer);

router.get(`${baseRoute}/search`, controller.searchSecurityConfigBlackListIP);

// - /api/1.0.0/security/configs/blacklistips/:id
router.get(`${baseRoute}/:id`, controller.getSecurityConfigBlackListIP);

// - /api/1.0.0/security/configs/blacklistips
router.get(`${baseRoute}/`, controller.getSecurityConfigBlackListIPs);

// - /api/1.0.0/security/configs/blacklistips
router.post(`${baseRoute}/`, controller.postSecurityConfigBlackListIP);

// - /api/1.0.0/security/configs/blacklistips/:id
router.patch(`${baseRoute}/:id`, verifyDelete, controller.patchSecurityConfigBlackListIP);

// - /api/1.0.0/security/configs/blacklistips/:id
router.delete(`${baseRoute}/:id`, controller.deleteSecurityConfigBlackListIP);

// - /api/1.0.0/security/configs/blacklistips/search

module.exports = router;