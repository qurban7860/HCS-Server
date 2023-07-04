const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');


const controllers = require('../controllers');
const controller = controllers.securityRoleController;

const router = express.Router();

//  - base route for module
// - /api/1.0.0/security/roles/

// - /api/1.0.0/security/roles/:id
const baseRoute = `/roles`;

router.use(checkAuth, checkCustomer);

// - /api/1.0.0/security/roles/search
router.get(`${baseRoute}/search`, controller.searchRoles);

// - /api/1.0.0/security/roles/:id
router.get(`${baseRoute}/:id`, controller.getSecurityRole);

// - /api/1.0.0/security/roles
router.get(`${baseRoute}/`, controller.getSecurityRoles);

// - /api/1.0.0/security/roles
router.post(`${baseRoute}/`, controller.postSecurityRole);

// - /api/1.0.0/security/roles/:id
router.patch(`${baseRoute}/:id`, controller.patchSecurityRole);

// - /api/1.0.0/security/roles/:id
router.delete(`${baseRoute}/:id`, controller.deleteSecurityRole);



module.exports = router;