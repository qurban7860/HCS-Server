const express = require('express');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const controllers = require('../controllers');
const controller = controllers.requestTypeController;
const router = express.Router();

const baseRoute = `/settings/requestTypes`;

router.use(checkAuth);

// router.get(`${baseRoute}/search`, controller.searchTicketIssueTypes );

router.get(`${baseRoute}/:id`, checkCustomer, controller.getTicketRequestType);

router.get(`${baseRoute}/`, controller.getTicketRequestTypes);

router.post(`${baseRoute}/`, checkCustomer, controller.postTicketRequestType);

router.patch(`${baseRoute}/:id`, checkCustomer, controller.patchTicketRequestType);

router.delete(`${baseRoute}/:id`, checkCustomer, controller.deleteTicketRequestType);

module.exports = router;