const express = require('express');
const checkAuth = require('../../../middleware/check-auth');
const checkIDs = require('../../../middleware/validateParamIDs');
const controllers = require('../controllers');
const controller = controllers.ticketHistoryController;
const router = express.Router();
const validate = require('../utils/validate');

const baseRoute = `/:ticketId/history`; 

router.use( checkAuth );

router.get(`${baseRoute}/:id`, checkIDs( validate.ticketIdAndId ), controller.getTicketHistory );

router.get(`${baseRoute}/`, checkIDs( validate.ticketId ), controller.getTicketHistories );

module.exports = router;