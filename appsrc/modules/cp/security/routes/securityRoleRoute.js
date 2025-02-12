const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');
const controllers = require('../../../security/controllers');
const controller = controllers.securityRoleController;

const router = express.Router();
// - /api/1.0.0/cp/security/roles/:id
const baseRoute = `/roles`;

router.use(checkAuth);

// - /api/1.0.0/cp/security/roles/:id
router.get(`${baseRoute}/:id`, controller.getSecurityRole);

// - /api/1.0.0/cp/security/roles
router.get(`${baseRoute}/`, controller.getSecurityRoles);

module.exports = router; 