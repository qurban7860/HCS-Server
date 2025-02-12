const express = require('express');
const multer = require('multer');
const checkAuth = require('../../../middleware/check-auth');
const { uploadHandler, checkMaxCount, imageOptimization } = require('../../../middleware/file-upload');
const controllers = require('../controllers');
const { ticketSchema } = require('../schema/ticketSchemas');
const { validateRequest } = require('../../../configs/reqServices');
const controller = controllers.ticketController;
const router = express.Router();

const storage = multer.memoryStorage();

router.use(checkAuth);

// router.get(`/search`, controller.searchTickets );

router.get(`/settings`, controller.getTicketSettings);

router.get(`/`, controller.getTickets);

router.get(`/:id`, controller.getTicket);

router.post(`/`, uploadHandler, validateRequest(ticketSchema('new')), checkMaxCount, imageOptimization, controller.postTicket);

router.patch(`/:id`, uploadHandler, validateRequest(ticketSchema()), checkMaxCount, imageOptimization, controller.patchTicket);

router.delete(`/:id`, controller.deleteTicket);

module.exports = router;
