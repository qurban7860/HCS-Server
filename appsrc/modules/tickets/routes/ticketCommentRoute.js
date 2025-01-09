const express = require('express');

const checkAuth = require('../../../middleware/check-auth');
const verifyDelete = require('../../../middleware/verifyDelete');
const checkParentID = require('../../../middleware/check-parentID');
const { Ticket } = require('../models');
const controllers = require('../controllers');
const controller = controllers.ticketCommentController;

const router = express.Router();

const baseRouteForObject = `/:ticketId/comments`; 

router.use(checkAuth, checkParentID( "ticket", Ticket));

router.get(`${baseRouteForObject}/:id`, controller.getTicketComment );

router.get(`${baseRouteForObject}/`, controller.getTicketComments);

router.post(`${baseRouteForObject}/`,  controller.postTicketComment);

router.patch(`${baseRouteForObject}/:id`, verifyDelete, controller.patchTicketComment);

router.delete(`${baseRouteForObject}/:id`, controller.deleteTicketComment);

router.get(`${baseRouteForObject}/stream`, controller.streamTicketComments);

module.exports = router;