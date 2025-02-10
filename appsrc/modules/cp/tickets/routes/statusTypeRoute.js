const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');
const roleCheck = require('../../../../middleware/role-check');
const checkCustomer = require('../../../../middleware/check-customer');
const customerDataFilter = require('../../../../middleware/customer-data-filter');
const controllers = require('../../../tickets/controllers');
const controller = controllers.statusTypeController;
const router = express.Router();

const baseRoute = `/settings/statusTypes`; 

router.use(checkAuth, customerDataFilter);

router.get(`${baseRoute}/:id`, checkCustomer, controller.getTicketStatusType);

router.get(`${baseRoute}/`, controller.getTicketStatusTypes);

router.post(`${baseRoute}/`, checkCustomer, controller.postTicketStatusType);

router.patch(`${baseRoute}/:id`, checkCustomer, controller.patchTicketStatusType);

router.delete(`${baseRoute}/:id`, checkCustomer, controller.deleteTicketStatusType);

module.exports = router; 