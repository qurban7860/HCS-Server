const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../../../middleware/check-auth');
const verifyDelete = require('../../../middleware/verifyDelete');
const controllers = require('../controllers');
const controller = controllers.securityConfigController;
const checkCustomer = require('../../../middleware/check-customer');

const router = express.Router();

const baseRoute = `/configs`;

router.use(checkAuth, checkCustomer);

// router.get(`${baseRoute}/search`, controller.searchSecurityConfig);

// // - /api/1.0.0/security/configs/:id
// router.get(`${baseRoute}/:id`, controller.getSecurityConfig);

// // - /api/1.0.0/security/configs
// router.get(`${baseRoute}/`, controller.getSecurityConfigs);

// // - /api/1.0.0/security/configs
// router.post(`${baseRoute}/`, controller.postSecurityConfig);

// // - /api/1.0.0/security/configs/:id
// router.patch(`${baseRoute}/:id`, verifyDelete, controller.patchSecurityConfig);

// // - /api/1.0.0/security/configs/:id
// router.delete(`${baseRoute}/:id`, controller.deleteSecurityConfig);

// - /api/1.0.0/security/configs/search

module.exports = router;