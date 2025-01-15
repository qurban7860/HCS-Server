const express = require('express');

const checkAuth = require('../../../middleware/check-auth');
const verifyDelete = require('../../../middleware/verifyDelete');
const checkIDs = require('../../../middleware/validateParamIDs');
const { Ticket } = require('../models');
const controllers = require('../controllers');
const validate = require('../utils/validate');
const controller = controllers.ticketCommentController;

const router = express.Router({ mergeParams: true });

const baseRoute = `/:ticketId/comments`; 

router.use(checkAuth );

router.get(`${baseRoute}/:id`, checkIDs( validate.ticketIdAndId ), controller.getTicketComment );

router.get(`${baseRoute}/`, checkIDs( validate.ticketId ), controller.getTicketComments);

router.post(`${baseRoute}/`, checkIDs( validate.ticket ), controller.postTicketComment);

router.patch(`${baseRoute}/:id`, checkIDs( validate.ticketIdAndId ), verifyDelete, controller.patchTicketComment);

router.delete(`${baseRoute}/:id`, checkIDs( validate.ticketIdAndId ), controller.deleteTicketComment);

router.get(`${baseRoute}/stream`, checkIDs( validate.ticketId ), controller.streamTicketComments);

module.exports = router;