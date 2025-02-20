const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../../../middleware/check-auth');
const verifyDelete = require('../../../middleware/verifyDelete');
const checkIDs = require('../../../middleware/validateParamIDs');
const validate = require('../utils/validate');

const controllers = require('../controllers');
const controller = controllers.securityConfigWhileListIPController;
const checkCustomer = require('../../../middleware/check-customer');

const router = express.Router();

const baseRoute = `/configs/Whitelistips`;

router.use(checkAuth, checkCustomer);

router.get(`${baseRoute}/search`, controller.searchSecurityConfigWhiteListIP);

// - /api/1.0.0/security/configs/whitelistips/:id
router.get(`${baseRoute}/:id`, checkIDs(validate.id), controller.getSecurityConfigWhiteListIP);

// - /api/1.0.0/security/configs/whitelistips
router.get(`${baseRoute}/`, controller.getSecurityConfigWhiteListIPs);

// - /api/1.0.0/security/configs/whitelistips
router.post(`${baseRoute}/`, controller.postSecurityConfigWhiteListIP);

// - /api/1.0.0/security/configs/whitelistips/:id
router.patch(`${baseRoute}/:id`, checkIDs(validate.id), verifyDelete, controller.patchSecurityConfigWhiteListIP);

// - /api/1.0.0/security/configs/whitelistips/:id
router.delete(`${baseRoute}/:id`, checkIDs(validate.id), controller.deleteSecurityConfigWhiteListIP);

// - /api/1.0.0/security/configs/whitelistips/search

module.exports = router;