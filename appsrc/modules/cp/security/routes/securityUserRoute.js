const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../../../../middleware/check-auth');
const checkCustomer = require('../../../../middleware/check-customer');
const verifyDelete = require('../../../../middleware/verifyDelete');

const controllers = require('../../../security/controllers');
const controller = controllers.securityUserController;

const router = express.Router();

const baseRoute = `/users`;

router.use(checkAuth, checkCustomer);

// - /api/1.0.0/cp/security/users
router.get(`${baseRoute}/`, controller.getSecurityUsers);

// - /api/1.0.0/cp/security/users/:id
router.get(`${baseRoute}/:id`, controller.getSecurityUser);

// - /api/1.0.0/cp/security/users/updatePassword/:id
router.patch(`${baseRoute}/updatePassword/:id`, controller.patchSecurityUser);

module.exports = router; 