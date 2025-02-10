const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');
const roleCheck = require('../../../../middleware/role-check');
const checkCustomer = require('../../../../middleware/check-customer');
const customerDataFilter = require('../../../../middleware/customer-data-filter');
const controllers = require('../../../tickets/controllers');
const controller = controllers.impactController;
const router = express.Router();

const baseRoute = `/settings/impacts`; 

router.use(checkAuth, customerDataFilter);

router.get(`${baseRoute}/:id`, checkCustomer, controller.getTicketImpact);

router.get(`${baseRoute}/`, controller.getTicketImpacts);

router.post(`${baseRoute}/`, checkCustomer, controller.postTicketImpact);

router.patch(`${baseRoute}/:id`, checkCustomer, controller.patchTicketImpact);

router.delete(`${baseRoute}/:id`, checkCustomer, controller.deleteTicketImpact);

module.exports = router; 