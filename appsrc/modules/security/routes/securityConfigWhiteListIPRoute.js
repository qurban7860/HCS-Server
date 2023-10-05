const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const verifyDelete = require('../../../middleware/verifyDelete');
// const { Customer } = require('../models');
// const checkCustomerID = require('../../../middleware/check-parentID')('customer', Customer);



const controllers = require('../controllers');
const controller = controllers.securityConfigWhileListIPController;
const checkCustomer = require('../../../middleware/check-customer');

const router = express.Router();

//  - base route for module
// - /api/1.0.0/security/configs/whitelistips

const baseRoute = `/configsWhitelistips`;

router.use(checkAuth, checkCustomer);

router.get(`${baseRoute}/search`, controller.searchSecurityConfigWhiteListIP);

// - /api/1.0.0/security/configs/whitelistips/:id
router.get(`${baseRoute}/:id`, controller.getSecurityConfigWhiteListIP);

// - /api/1.0.0/security/configs/whitelistips
router.get(`${baseRoute}/`, controller.getSecurityConfigWhiteListIPs);

// - /api/1.0.0/security/configs/whitelistips
router.post(`${baseRoute}/`, controller.postSecurityConfigWhiteListIP);

// - /api/1.0.0/security/configs/whitelistips/:id
router.patch(`${baseRoute}/:id`, verifyDelete, controller.patchSecurityConfigWhiteListIP);

// - /api/1.0.0/security/configs/whitelistips/:id
router.delete(`${baseRoute}/:id`, controller.deleteSecurityConfigWhiteListIP);

// - /api/1.0.0/security/configs/whitelistips/search

module.exports = router;