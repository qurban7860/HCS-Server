const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');
const validateCustomerInQuery = require('../../../../middleware/validateCustomerInQuery');
const controllers = require('../../../security/controllers');
const controller = controllers.securityUserController;

const router = express.Router();
const baseRoute = `/users`;

router.use(checkAuth);

// - /api/1.0.0/cp/security/users
router.get(`${baseRoute}/`, validateCustomerInQuery, controller.getSecurityUsers);

// - /api/1.0.0/cp/security/users/:id
router.get(`${baseRoute}/:id`, validateCustomerInQuery, controller.getSecurityUser);

// - /api/1.0.0/cp/security/users/updatePassword/:id
router.patch(`${baseRoute}/updatePassword/:id`, controller.patchSecurityUser);

module.exports = router; 