const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const verifyDelete = require('../../../middleware/verifyDelete');
const checkIDs = require('../../../middleware/validateParamIDs');
const validate = require('../utils/validate');

const controllers = require('../controllers');
const controller = controllers.securityModuleController;

const router = express.Router();

// - /api/1.0.0/security/modules/:id
const baseRoute = `/modules`;

router.use(checkAuth, checkCustomer);

// - /api/1.0.0/security/modules/:id
router.get(`${baseRoute}/:id`, checkIDs(validate.id), controller.getSecurityModule);

// - /api/1.0.0/security/modules
router.get(`${baseRoute}/`, controller.getSecurityModules);

// - /api/1.0.0/security/modules
router.post(`${baseRoute}/`, controller.postSecurityModule);

// - /api/1.0.0/security/modules/:id
router.patch(`${baseRoute}/:id`, checkIDs(validate.id), verifyDelete, controller.patchSecurityModule);

// - /api/1.0.0/security/modules/:id
router.delete(`${baseRoute}/:id`, checkIDs(validate.id), controller.deleteSecurityModule);

module.exports = router;