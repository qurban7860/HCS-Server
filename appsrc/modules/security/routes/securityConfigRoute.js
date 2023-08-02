const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const verifyDelete = require('../../../middleware/verifyDelete');
// const { Customer } = require('../models');
// const checkCustomerID = require('../../../middleware/check-parentID')('customer', Customer);



const controllers = require('../controllers');
const controller = controllers.securityConfigController;
const checkCustomer = require('../../../middleware/check-customer');

const router = express.Router();

//  - base route for module
// - /api/1.0.0/security/configs/

// - /api/1.0.0/security/configs/:id
const baseRoute = `/configs`;

router.use(checkAuth, checkCustomer);

router.get(`${baseRoute}/search`, controller.searchSecurityConfig);

// - /api/1.0.0/security/configs/:id
router.get(`${baseRoute}/:id`, controller.getSecurityConfig);

// - /api/1.0.0/security/configs
router.get(`${baseRoute}/`, controller.getSecurityConfigs);

// - /api/1.0.0/security/configs
router.post(`${baseRoute}/`, controller.postSecurityConfig);

// - /api/1.0.0/security/configs/:id
router.patch(`${baseRoute}/:id`, verifyDelete, controller.patchSecurityConfig);

// - /api/1.0.0/security/configs/:id
router.delete(`${baseRoute}/:id`, controller.deleteSecurityConfig);

// - /api/1.0.0/security/configs/search

module.exports = router;