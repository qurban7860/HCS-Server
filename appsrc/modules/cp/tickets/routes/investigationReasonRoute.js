const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');
const roleCheck = require('../../../../middleware/role-check');
const checkCustomer = require('../../../../middleware/check-customer');
const customerDataFilter = require('../../../../middleware/customer-data-filter');
const controllers = require('../../../tickets/controllers');
const controller = controllers.investigationReasonController;
const router = express.Router();

const baseRoute = `/settings/investigationReasons`; 

router.use(checkAuth, customerDataFilter);

router.get(`${baseRoute}/:id`, checkCustomer, controller.getTicketInvestigationReason);

router.get(`${baseRoute}/`, controller.getTicketInvestigationReasons);

router.post(`${baseRoute}/`, checkCustomer, controller.postTicketInvestigationReason);

router.patch(`${baseRoute}/:id`, checkCustomer, controller.patchTicketInvestigationReason);

router.delete(`${baseRoute}/:id`, checkCustomer, controller.deleteTicketInvestigationReason);

module.exports = router; 