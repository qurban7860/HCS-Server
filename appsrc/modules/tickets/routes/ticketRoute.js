const express = require('express');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const controllers = require('../controllers');
const controller = controllers.ticketController;
const router = express.Router();

const baseRoute = `/tickets`; 

router.use(checkAuth, checkCustomer);

// router.get(`${baseRoute}/search`, controller.searchTickets );

router.get(`${baseRoute}/:id`, controller.getTicket );

router.get(`${baseRoute}/`, controller.getTickets );

router.post(`${baseRoute}/`, controller.postTicket );

router.patch(`${baseRoute}/:id`, controller.patchTicket );

router.delete(`${baseRoute}/:id`, controller.deleteTicket );

module.exports = router;