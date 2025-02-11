const express = require('express');
const multer = require('multer');
const checkAuth = require('../../../middleware/check-auth');
const checkSpCustomer = require('../../../middleware/checkSpCustomer');
const checkNonSpCustomer = require('../../../middleware/checkNonSpCustomer');
const { uploadHandler, checkMaxCount, imageOptimization } = require('../../../middleware/file-upload');
const controllers = require('../controllers');
const { ticketSchema } = require('../schema/ticketSchemas');
const { validateRequest } = require('../../../configs/reqServices');
const controller = controllers.ticketController;
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.use(checkAuth);

// router.get(`/search`, controller.searchTickets );

router.get(`/settings`, controller.getTicketSettings);

router.get(`/`, checkNonSpCustomer, controller.getTickets);

router.get(`/:id`, checkNonSpCustomer, controller.getTicket);

router.post(`/`, checkSpCustomer, uploadHandler, validateRequest(ticketSchema('new')), checkMaxCount, imageOptimization, controller.postTicket);

router.patch(`/:id`, checkSpCustomer, uploadHandler, validateRequest(ticketSchema()), checkMaxCount, imageOptimization, controller.patchTicket);

router.delete(`/:id`, checkSpCustomer, controller.deleteTicket);

module.exports = router;