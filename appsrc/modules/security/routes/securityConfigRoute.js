const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
// const { Customer } = require('../models');
// const checkCustomerID = require('../../../middleware/check-parentID')('customer', Customer);



const controllers = require('../controllers');
const controller = controllers.securityConfigController;

const router = express.Router();

//  - base route for module
// - /api/1.0.0/security/configs/

// - /api/1.0.0/security/configs/:id
const baseRoute = `/configs`;

// router.use(checkAuth);

// - /api/1.0.0/security/configs/:id
router.get(`${baseRoute}/:id`, controller.getSecurityConfig);

// - /api/1.0.0/security/configs
router.get(`${baseRoute}/`,  controller.getSecurityConfigs);

// - /api/1.0.0/security/configs
router.post(`${baseRoute}/`, controller.postSecurityConfig);

// - /api/1.0.0/security/configs/:id
router.patch(`${baseRoute}/:id`,  controller.patchSecurityConfig);

// - /api/1.0.0/security/configs/:id
router.delete(`${baseRoute}/:id`,  controller.deleteSecurityConfig);

module.exports = router;