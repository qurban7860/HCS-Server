const express = require('express');
const router = express.Router();

const { uploadHandler, checkMaxCount, imageOptimization } = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const checkParentID = require('../../../middleware/check-parentID');
const controllers = require('../controllers');
const controller = controllers.ticketFileController;
const { Ticket } = require('../models');

const baseRoute = `/:ticketId/files`; 

router.use(checkAuth, checkParentID( "ticket", Ticket));

router.post(`${baseRoute}/`, uploadHandler, checkMaxCount, imageOptimization, controller.postTicketFile );

router.get(`${baseRoute}/:id`, controller.getTicketFile);

router.get(`${baseRoute}/`, controller.getTicketFiles);

router.delete(`${baseRoute}/:id/`, controller.deleteTicketFile );

module.exports = router;