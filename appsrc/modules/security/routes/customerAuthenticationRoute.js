const express = require('express');

const { SecurityUser } = require('../models');
// const checkUserID = require('../../../middleware/check-parentID')('user', SecurityUser);

const controllers = require('../controllers');
const controller = controllers.customerAuthenticationController;

const router = express.Router();

//  - base route for module
// - /api/1.0.0/customer

const validateIP = require('../../../middleware/validateIP');
// router.use(validateIP);
// - /api/1.0.0/customer/getToken/
router.post(`/getToken`, controller.login);

// - /api/1.0.0/customer/getToken/
router.post(`/refreshToken`, controller.refreshToken);

// - /api/1.0.0/customer/logout/:userID
router.post(`/logout/:userID`, controller.logout);

// - /api/1.0.0/customer/forgetPassword
router.post(`/forgetPassword`,  controller.forgetPassword);

// - /api/1.0.0/customer/multiFactorVerifyCode
router.post(`/multiFactorVerifyCode`,  controller.multiFactorVerifyCode);

// - /api/1.0.0/customer/forgetPassword/verifyToken
router.post(`/forgetPassword/verifyToken`,  controller.verifyForgottenPassword);



module.exports = router;