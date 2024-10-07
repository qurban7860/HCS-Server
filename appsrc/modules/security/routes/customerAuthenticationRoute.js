const express = require('express');

// const checkUserID = require('../../../middleware/check-parentID')('user', SecurityUser);

const controllers = require('../controllers');
const controller = controllers.customerAuthenticationController;

//  - base route for module - /api/1.0.0/customer

const router = express.Router();

const validateIP = require('../../../middleware/validateIP');
// router.use(validateIP);

// - /api/1.0.0/customer/getCustomerToken/
router.post(`/getCustomerToken`, controller.login);

// - /api/1.0.0/customer/refreshCustomerToken/
router.post(`/refreshCustomerToken`, controller.refreshToken);

// - /api/1.0.0/customer/customerLogout/:userID
router.post(`/logoutCustomer/:userID`, controller.logout);


module.exports = router;