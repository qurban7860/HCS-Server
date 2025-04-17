const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');
const validateCustomerInQuery = require('../../../../middleware/validateCustomerInQuery');
const validateCustomerInRequest = require('../../../../middleware/validateCustomerInRequest');
const controllers = require('../../../security/controllers');
const controller = controllers.securityUserController;
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');

const router = express.Router();
const baseRoute = `/users`;

router.use(checkAuth);

// - /api/1.0.0/cp/security/users
router.get(`${baseRoute}/`, validateCustomerInQuery, controller.getSecurityUsers);

// - /api/1.0.0/cp/security/users/:id
router.get(`${baseRoute}/:id`, checkIDs(validate.id), validateCustomerInQuery, controller.getSecurityUser);

// - /api/1.0.0/cp/security/users/:id
router.patch(`${baseRoute}/:id`, validateCustomerInRequest, checkIDs(validate.id), controller.patchSecurityUser);
// - /api/1.0.0/cp/security/users/updatePassword/:id
router.patch(`${baseRoute}/updatePassword/:id`, validateCustomerInRequest, checkIDs(validate.id), controller.patchSecurityUser);

module.exports = router; 