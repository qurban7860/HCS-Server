const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const verifyDelete = require('../../../middleware/verifyDelete');
const checkIDs = require('../../../middleware/validateParamIDs');
const validate = require('../utils/validate');

const controllers = require('../controllers');
const controller = controllers.securityUserController;

const router = express.Router();

const baseRoute = `/users`;

router.use(checkAuth, checkCustomer);

// - /api/1.0.0/security/users
router.get(`${baseRoute}/changeUserStatus/:id/:status/:minutes`, checkIDs(validate.id), controller.changeLockedStatus);

// - /api/1.0.0/security/users/validate
router.get(`${baseRoute}/validate`, controller.validateUser);

// - /api/1.0.0/security/users
router.get(`${baseRoute}/`, controller.getSecurityUsers);

// - /api/1.0.0/security/users/:id
router.get(`${baseRoute}/:id`, checkIDs(validate.id), controller.getSecurityUser);

// - /api/1.0.0/security/users
router.post(`${baseRoute}/`, controller.postSecurityUser);

// - /api/1.0.0/security/users/:id
router.patch(`${baseRoute}/:id`, checkIDs(validate.id), verifyDelete, controller.patchSecurityUser);

// - /api/1.0.0/security/users/updatePassword/:id
router.patch(`${baseRoute}/updatePassword/:id`, checkIDs(validate.id), controller.patchSecurityUser);

// - /api/1.0.0/security/users/:id
router.delete(`${baseRoute}/:id`, checkIDs(validate.id), controller.deleteSecurityUser);

module.exports = router;