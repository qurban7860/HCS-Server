const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');
const roleCheck = require('../../../../middleware/role-check');
const checkCustomer = require('../../../../middleware/check-customer');
const customerDataFilter = require('../../../../middleware/customer-data-filter');
const controllers = require('../../../tickets/controllers');
const controller = controllers.changeReasonController;
const router = express.Router();

const baseRoute = `/settings/changeReasons`; 

router.use(checkAuth, customerDataFilter);

router.get(`${baseRoute}/:id`, checkCustomer, controller.getTicketChangeReason);

router.get(`${baseRoute}/`, controller.getTicketChangeReasons);

router.post(`${baseRoute}/`, checkCustomer, controller.postTicketChangeReason);

router.patch(`${baseRoute}/:id`, checkCustomer, controller.patchTicketChangeReason);

router.delete(`${baseRoute}/:id`, checkCustomer, controller.deleteTicketChangeReason);

module.exports = router; 