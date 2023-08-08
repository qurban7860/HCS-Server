const express = require('express');

const { SecurityUser } = require('../models');
// const checkUserID = require('../../../middleware/check-parentID')('user', SecurityUser);

const controllers = require('../controllers');
const controller = controllers.securityAuthenticationController;

const router = express.Router();

//  - base route for module
// - /api/1.0.0/security/users/

// - /api/1.0.0/security/users/:id
// const baseRoute = `/users`;

const validateIP = require('../../../middleware/validateIP');
// router.use(validateIP);
// - /api/1.0.0/security/getToken/
router.post(`/getToken`, controller.login);

// - /api/1.0.0/security/getToken/
router.post(`/refreshToken`, controller.refreshToken);

// - /api/1.0.0/security/logout/:userID
router.post(`/logout/:userID`, controller.logout);

// - /api/1.0.0/security/forgetPassword
router.post(`/forgetPassword`,  controller.forgetPassword);

// - /api/1.0.0/security/multifactorverifyCode
router.post(`/multifactorverifyCode`,  controller.multifactorverifyCode);

// - /api/1.0.0/security/forgetPassword/verifyToken
router.post(`/forgetPassword/verifyToken`,  controller.verifyForgottenPassword);



module.exports = router;