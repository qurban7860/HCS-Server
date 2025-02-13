const express = require('express');
const controllers = require('../../../security/controllers');
const controller = controllers.securityAuthenticationController;
const customerController = controllers.customerAuthenticationController;
const router = express.Router();
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');

const validateIP = require('../../../../middleware/validateIP');

// - /api/1.0.0/cp/security/getCustomerToken
router.post(`/getCustomerToken`, customerController.login);

// - /api/1.0.0/cp/security/multifactorverifyCode
router.post(`/multifactorverifyCode`, controller.multifactorverifyCode);

// - /api/1.0.0/cp/security/register
// router.post(`/register`, controller.register);

// - /api/1.0.0/cp/security/logout/:userID
router.post(`/logout/:userID`, checkIDs(validate.userID), controller.logout);

// - /api/1.0.0/cp/security/forgetPassword
router.post(`/forgetPassword`, controller.forgetPassword);

// - /api/1.0.0/cp/security/forgetPassword/verifyToken
router.post(`/forgetPassword/verifyToken`, controller.verifyForgottenPassword);

module.exports = router; 