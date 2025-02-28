const express = require('express');

const checkAuth = require('../../../middleware/check-auth');
const verifyDelete = require('../../../middleware/verifyDelete'); 
const checkIDs = require('../../../middleware/validateParamIDs');
const { Ticket } = require('../models');  
const controllers = require('../controllers');
const validate = require('../utils/validate');
const controller = controllers.ticketWorkLogController; 

const router = express.Router({ mergeParams: true });

const baseRoute = `/:ticketId/workLogs`; 

router.use(checkAuth);

router.get(`${baseRoute}/:id`, checkIDs(validate.ticketIdAndId), controller.getTicketWorkLog); 

router.get(`${baseRoute}/`, checkIDs(validate.ticketId), controller.getTicketWorkLogs); 

router.post(`${baseRoute}/`, checkIDs(validate.ticket), controller.postTicketWorkLog); 

router.patch(`${baseRoute}/:id`, checkIDs(validate.ticketIdAndId), verifyDelete, controller.patchTicketWorkLog); 

router.delete(`${baseRoute}/:id`, checkIDs(validate.ticketIdAndId), controller.deleteTicketWorkLog); 


module.exports = router;
