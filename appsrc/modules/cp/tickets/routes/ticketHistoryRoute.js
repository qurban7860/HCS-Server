const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');
const roleCheck = require('../../../../middleware/role-check');
const checkCustomer = require('../../../../middleware/check-customer');
const customerDataFilter = require('../../../../middleware/customer-data-filter');
const checkIDs = require('../../../../middleware/validateParamIDs');
const controllers = require('../../../tickets/controllers');
const controller = controllers.ticketHistoryController;
const router = express.Router();
const validate = require('../../../tickets/utils/validate');

// - /api/1.0.0/cp/tickets/history
const baseRoute = `/:ticketId/history`; 

router.use(checkAuth, customerDataFilter);

router.get(`${baseRoute}/:id`, checkIDs(validate.ticketIdAndId), controller.getTicketHistory);

router.get(`${baseRoute}/`, checkIDs(validate.ticketId), controller.getTicketHistories);

module.exports = router; 