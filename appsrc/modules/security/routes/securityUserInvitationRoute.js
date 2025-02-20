const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const verifyDelete = require('../../../middleware/verifyDelete');
const checkIDs = require('../../../middleware/validateParamIDs');
const validate = require('../utils/validate');

const controllers = require('../controllers');
const controller = controllers.securityUserInvitationController;

const router = express.Router();

// - /api/1.0.0/security/invites/
const baseRoute = `/invites`;

router.use( checkAuth );

router.get(`${baseRoute}/:id`, checkIDs(validate.id), controller.getUserInvitation);

router.get(`${baseRoute}/`, controller.getUserInvitations);

router.post(`${baseRoute}/postUserInvite/`, controller.postUserInvite);

router.get(`${baseRoute}/sendUserInvite/:id`, checkIDs(validate.id), controller.sendUserInvite);

router.get(`${baseRoute}/verifyInviteCode/:id/:code`, checkIDs(validate.id), controller.verifyInviteCode);

router.patch(`${baseRoute}/:id`, controller.patchUserInvitation);

router.patch(`${baseRoute}/setInvitedUserPasswordDetails/:id`, checkIDs(validate.id), controller.setInvitedUserPassword);

module.exports = router;