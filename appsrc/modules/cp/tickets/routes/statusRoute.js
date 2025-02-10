const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');
const roleCheck = require('../../../../middleware/role-check');
const checkCustomer = require('../../../../middleware/check-customer');
const customerDataFilter = require('../../../../middleware/customer-data-filter');
const controllers = require('../../../tickets/controllers');
const controller = controllers.statusController;
const router = express.Router();

const baseRoute = `/settings/statuses`; 

router.use(checkAuth, customerDataFilter);

router.get(`${baseRoute}/:id`, checkCustomer, controller.getTicketStatus);

router.get(`${baseRoute}/`, controller.getTicketStatuses);

router.post(`${baseRoute}/`, checkCustomer, controller.postTicketStatus);

router.patch(`${baseRoute}/:id`, checkCustomer, controller.patchTicketStatus);

router.delete(`${baseRoute}/:id`, checkCustomer, controller.deleteTicketStatus);

module.exports = router; 