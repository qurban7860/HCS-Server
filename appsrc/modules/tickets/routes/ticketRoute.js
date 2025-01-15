const express = require('express');
const checkAuth = require('../../../middleware/check-auth');
const { uploadHandler, checkMaxCount, imageOptimization } = require('../../../middleware/file-upload');
const controllers = require('../controllers');
const { ticketSchema } = require('../schema/ticketSchemas');
const { validateRequest } = require('../../../configs/reqServices');
const controller = controllers.ticketController;
const router = express.Router();

router.use( checkAuth );

// router.get(`/search`, controller.searchTickets );

router.get(`/settings`, controller.getTicketSettings );

router.get(`/`, controller.getTickets );

router.get(`/:id`, controller.getTicket );

router.post(`/`, validateRequest( ticketSchema('new') ), uploadHandler, checkMaxCount, imageOptimization, controller.postTicket );

router.patch(`/:id`, validateRequest( ticketSchema() ), uploadHandler, checkMaxCount, imageOptimization, controller.patchTicket );

router.delete(`/:id`, controller.deleteTicket );

module.exports = router;