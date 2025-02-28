const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');
const roleCheck = require('../../../../middleware/role-check'); 
const checkCustomer = require('../../../../middleware/check-customer'); 
const customerDataFilter = require('../../../../middleware/customer-data-filter'); 
const verifyDelete = require('../../../../middleware/verifyDelete'); 
const checkIDs = require('../../../../middleware/validateParamIDs');
const { Ticket } = require('../../../tickets/models');
const controllers = require('../../../tickets/controllers');
const validate = require('../../../tickets/utils/validate');
const controller = controllers.ticketWorkLogController; 

const router = express.Router({ mergeParams: true });

const baseRoute = `/:ticketId/workLogs`; 

router.use(checkAuth); 

router.get(`${baseRoute}/:id`, checkIDs(validate.ticketIdAndId), controller.getTicketWorkLog); 

router.get(`${baseRoute}/`, checkIDs(validate.ticketId), controller.getTicketWorkLogs); 

router.post(`${baseRoute}/`, checkIDs(validate.ticketId), controller.postTicketWorkLog); 

router.patch(`${baseRoute}/:id`, checkIDs(validate.ticketIdAndId), verifyDelete, controller.patchTicketWorkLog); 

router.delete(`${baseRoute}/:id`, checkIDs(validate.ticketIdAndId), controller.deleteTicketWorkLog); 


module.exports = router;