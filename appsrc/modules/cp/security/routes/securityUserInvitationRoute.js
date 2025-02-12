const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');
const controllers = require('../../../security/controllers');
const controller = controllers.securityUserInvitationController;
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');
const router = express.Router();

// - /api/1.0.0/cp/security/invites/
const baseRoute = `/invites`;

router.use(checkAuth);

router.get(`${baseRoute}/sendUserInvite/:id`, checkIDs(validate.id), controller.sendUserInvite);

router.get(`${baseRoute}/verifyInviteCode/:id/:code`, checkIDs(validate.id), controller.verifyInviteCode);

router.patch(`${baseRoute}/setInvitedUserPasswordDetails/:id`, checkIDs(validate.id), controller.setInvitedUserPassword);

module.exports = router; 