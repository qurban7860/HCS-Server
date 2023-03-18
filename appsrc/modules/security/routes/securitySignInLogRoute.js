const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');


const controllers = require('../controllers');
const controller = controllers.securityAuthenticationController;

const router = express.Router();

//  - base route for module
// - /api/1.0.0/security/users/

// - /api/1.0.0/security/users/:id
const baseRoute = `/users/:userId/auditlogs/`;

// router.use(checkAuth);

// - /api/1.0.0/security/getToken/
router.post(`/getToken/`, controller.login);

// - /api/1.0.0/security/forgetPasswd/
// router.get(`${baseRoute}/`,  controller.getSecurityUsers);

// // - /api/1.0.0/security/logout/:userId
// router.post(`${baseRoute}/`, controller.postSecurityUser);

// // - /api/1.0.0/security/users/:id
// router.patch(`${baseRoute}/:id`,  controller.patchSecurityUser);

// // - /api/1.0.0/security/users/:id
// router.delete(`${baseRoute}/:id`,  controller.deleteSecurityUser);



module.exports = router;