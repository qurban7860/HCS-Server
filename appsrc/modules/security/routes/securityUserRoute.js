const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const verifyDelete = require('../../../middleware/verifyDelete');

const controllers = require('../controllers');
const controller = controllers.securityUserController;

const router = express.Router();

const baseRoute = `/users`;

router.use(checkAuth, checkCustomer);

// - /api/1.0.0/security/users/:id
router.get(`${baseRoute}/:id`, controller.getSecurityUser);

// - /api/1.0.0/security/users
router.get(`${baseRoute}/`, controller.getSecurityUsers);

// - /api/1.0.0/security/users
router.get(`${baseRoute}/changeUserStatus/:id/:status/:minutes`, controller.changeLockedStatus);

// - /api/1.0.0/security/users
router.post(`${baseRoute}/`, controller.postSecurityUser);

// - /api/1.0.0/security/users/:id
router.patch(`${baseRoute}/:id`, verifyDelete, controller.patchSecurityUser);

// - /api/1.0.0/security/users/updatePassword/:id
router.patch(`${baseRoute}/updatePassword/:id`, controller.patchSecurityUser);

// - /api/1.0.0/security/users/:id
router.delete(`${baseRoute}/:id`,  controller.deleteSecurityUser);

module.exports = router;