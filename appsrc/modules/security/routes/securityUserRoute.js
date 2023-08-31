const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const verifyDelete = require('../../../middleware/verifyDelete');


const controllers = require('../controllers');
const controller = controllers.securityUserController;

const router = express.Router();

//  - base route for module
// - /api/1.0.0/security/users/

// - /api/1.0.0/security/users/:id
const baseRoute = `/users`;

router.use(checkAuth, checkCustomer);


// - /api/1.0.0/security/users/:id
router.get(`${baseRoute}/:id`, controller.getSecurityUser);

// - /api/1.0.0/security/users
router.get(`${baseRoute}/sendUserInvite/:id`, controller.sendUserInvite);

// - /api/1.0.0/security/users
router.get(`${baseRoute}/verifyInviteCode/:id/:code`, controller.verifyInviteCode);

// - /api/1.0.0/security/users
router.get(`${baseRoute}/`, controller.getSecurityUsers);


// - /api/1.0.0/security/users
router.post(`${baseRoute}/`, controller.postSecurityUser);

// - /api/1.0.0/security/users/:id
router.patch(`${baseRoute}/:id`, verifyDelete, controller.patchSecurityUser);

// - /api/1.0.0/security/users/updatePassword/:id
router.patch(`${baseRoute}/updatePasswordUserInvite/:id`, controller.updatePasswordUser);

// - /api/1.0.0/security/users/updatePassword/:id
router.patch(`${baseRoute}/updatePassword/:id`, controller.patchSecurityUser);

// - /api/1.0.0/security/users/:id
router.delete(`${baseRoute}/:id`,  controller.deleteSecurityUser);



module.exports = router;