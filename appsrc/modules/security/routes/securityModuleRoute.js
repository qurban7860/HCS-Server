const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
// const { Customer } = require('../models');
// const checkCustomerID = require('../../../middleware/check-parentID')('customer', Customer);



const controllers = require('../controllers');
const controller = controllers.securityModuleController;

const router = express.Router();

//  - base route for module
// - /api/1.0.0/security/modules/

// - /api/1.0.0/security/modules/:id
const baseRoute = `/modules`;

// router.use(checkAuth);

// - /api/1.0.0/security/modules/:id
router.get(`${baseRoute}/:id`, controller.getSecurityModule);

// - /api/1.0.0/security/modules
router.get(`${baseRoute}/`,  controller.getSecurityModules);

// - /api/1.0.0/security/modules
router.post(`${baseRoute}/`, controller.postSecurityModule);

// - /api/1.0.0/security/modules/:id
router.patch(`${baseRoute}/:id`,  controller.patchSecurityModule);

// - /api/1.0.0/security/modules/:id
router.delete(`${baseRoute}/:id`,  controller.deleteSecurityModule);

module.exports = router;