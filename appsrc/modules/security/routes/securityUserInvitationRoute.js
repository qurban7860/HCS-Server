const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const verifyDelete = require('../../../middleware/verifyDelete');
const controllers = require('../controllers');
const controller = controllers.securityUserInvitationController;

const router = express.Router();

// - /api/1.0.0/security/invites/
const baseRoute = `/invites`;

router.use( checkAuth );

router.get(`${baseRoute}/:id`, controller.getUserInvitation);

router.get(`${baseRoute}/`, controller.getUserInvitations);

router.post(`${baseRoute}/postUserInvite/`, controller.postUserInvite);

router.get(`${baseRoute}/sendUserInvite/:id`, controller.sendUserInvite);

router.get(`${baseRoute}/verifyInviteCode/:id/:code`, controller.verifyInviteCode);

router.patch(`${baseRoute}/:id`, controller.patchUserInvitation);

router.patch(`${baseRoute}/setInvitedUserPasswordDetails/:id`, controller.setInvitedUserPassword);

module.exports = router;