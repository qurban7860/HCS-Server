const express = require('express');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const controllers = require('../controllers');
const controller = controllers.statusController;
const router = express.Router();

const baseRoute = `/settings/statuses`; 

router.use(checkAuth );

// router.get(`${baseRoute}/search`, controller.searchTicketStatuses );

router.get(`${baseRoute}/:id`, checkCustomer, controller.getTicketStatus );

router.get(`${baseRoute}/`, controller.getTicketStatuses );

router.post(`${baseRoute}/`, checkCustomer, controller.postTicketStatus );

router.patch(`${baseRoute}/:id`, checkCustomer, controller.patchTicketStatus );

router.delete(`${baseRoute}/:id`, checkCustomer, controller.deleteTicketStatus );

module.exports = router;