const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');
const checkCustomer = require('../../../../middleware/check-customer');
const customerDataFilter = require('../../../../middleware/customer-data-filter');
const controllers = require('../../../tickets/controllers');
const controller = controllers.priorityController;
const router = express.Router();

const baseRoute = `/settings/priorities`;

router.use(checkAuth, customerDataFilter);

router.get(`${baseRoute}/:id`, checkCustomer, controller.getTicketPriority);

router.get(`${baseRoute}/`, controller.getTicketPriorities);

router.post(`${baseRoute}/`, checkCustomer, controller.postTicketPriority);

router.patch(`${baseRoute}/:id`, checkCustomer, controller.patchTicketPriority);

router.delete(`${baseRoute}/:id`, checkCustomer, controller.deleteTicketPriority);

module.exports = router; 