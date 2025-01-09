const express = require('express');
const checkAuth = require('../../../middleware/check-auth');
const checkParentID = require('../../../middleware/check-parentID');
const controllers = require('../controllers');
const controller = controllers.ticketHistoryController;
const router = express.Router();
const { Ticket } = require('../models');

const baseRoute = `/:ticketId/history`; 

router.use( checkAuth, checkParentID( "ticket", Ticket) );

router.get(`${baseRoute}/:id`, controller.getTicketHistory );

router.get(`${baseRoute}/`, controller.getTicketHistories );

module.exports = router;