const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const checkIDs = require('../../../middleware/validateParamIDs');
const validate = require('../utils/validate');

const controllers = require('../controllers');
const controller = controllers.securityRoleController;

const router = express.Router();
// - /api/1.0.0/security/roles/:id
const baseRoute = `/roles`;

router.use(checkAuth, checkCustomer);

// - /api/1.0.0/security/roles/search
router.get(`${baseRoute}/search`, controller.searchRoles);

// - /api/1.0.0/security/roles/:id
router.get(`${baseRoute}/:id`, checkIDs(validate.id), controller.getSecurityRole);

// - /api/1.0.0/security/roles
router.get(`${baseRoute}/`, controller.getSecurityRoles);

// - /api/1.0.0/security/roles
router.post(`${baseRoute}/`, controller.postSecurityRole);

// - /api/1.0.0/security/roles/:id
router.patch(`${baseRoute}/:id`, checkIDs(validate.id), controller.patchSecurityRole);

// - /api/1.0.0/security/roles/:id
router.delete(`${baseRoute}/:id`, checkIDs(validate.id), controller.deleteSecurityRole);

module.exports = router;