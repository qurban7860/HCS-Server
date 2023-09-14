const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const verifyDelete = require('../../../middleware/verifyDelete');



const controllers = require('../controllers');
const controller = controllers.securityModuleController;

const router = express.Router();

//  - base route for module
// - /api/1.0.0/security/modules/

// - /api/1.0.0/security/modules/:id
const baseRoute = `/modules`;

router.use(checkAuth, checkCustomer);

// - /api/1.0.0/security/modules/:id
router.get(`${baseRoute}/:id`, controller.getSecurityModule);

// - /api/1.0.0/security/modules
router.get(`${baseRoute}/`, controller.getSecurityModules);

// - /api/1.0.0/security/modules
router.post(`${baseRoute}/`, controller.postSecurityModule);

// - /api/1.0.0/security/modules/:id
router.patch(`${baseRoute}/:id`, verifyDelete, controller.patchSecurityModule);

// - /api/1.0.0/security/modules/:id
router.delete(`${baseRoute}/:id`, controller.deleteSecurityModule);

module.exports = router;