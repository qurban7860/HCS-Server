const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const verifyDelete = require('../../../middleware/verifyDelete');


const controllers = require('../controllers');
const controller = controllers.securityUserInvitationController;

const router = express.Router();

//  - base route for module
// - /api/1.0.0/security/userInvitations/
const baseRoute = `/userInvitations`;

router.use(checkAuth, checkCustomer);

// - /api/1.0.0/security/userInvitations/:id
router.get(`${baseRoute}/:id`, controller.getUserInvitation);


// - /api/1.0.0/security/userInvitations/
router.get(`${baseRoute}/`, controller.getUserInvitations);

// // - /api/1.0.0/security/userInvitations
// router.post(`${baseRoute}/`, controller.postUserInvitation);

// - /api/1.0.0/security/userInvitations/updatePassword/:id
router.patch(`${baseRoute}/:id`, controller.patchUserInvitation);


// - /api/1.0.0/security/users
router.get(`${baseRoute}/sendUserInvite/:id`, controller.sendUserInvite);

// - /api/1.0.0/security/users
router.get(`${baseRoute}/verifyInviteCode/:id/:code`, controller.verifyInviteCode);


// - /api/1.0.0/security/users/updatePassword/:id
router.patch(`${baseRoute}/updatePasswordUserInvite/:id`, controller.updatePasswordUser);


module.exports = router;