const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');
const roleCheck = require('../../../../middleware/role-check');
const checkCustomer = require('../../../../middleware/check-customer');
const customerDataFilter = require('../../../../middleware/customer-data-filter');
const controllers = require('../../../tickets/controllers');
const controller = controllers.issueTypeController;
const router = express.Router();

const baseRoute = `/settings/issueTypes`; 

router.use(checkAuth, customerDataFilter);

router.get(`${baseRoute}/:id`, checkCustomer, controller.getTicketIssueType);

router.get(`${baseRoute}/`, controller.getTicketIssueTypes);

router.post(`${baseRoute}/`, checkCustomer, controller.postTicketIssueType);

router.patch(`${baseRoute}/:id`, checkCustomer, controller.patchTicketIssueType);

router.delete(`${baseRoute}/:id`, checkCustomer, controller.deleteTicketIssueType);

module.exports = router; 