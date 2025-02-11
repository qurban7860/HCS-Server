const express = require('express');
const multer = require('multer');
const checkAuth = require('../../../../middleware/check-auth');
const roleCheck = require('../../../../middleware/role-check');
const checkCustomer = require('../../../../middleware/check-customer');
const checkNonSpCustomer = require('../../../../middleware/checkNonSpCustomer');
const customerDataFilter = require('../../../../middleware/customer-data-filter');
const { uploadHandler, checkMaxCount, imageOptimization } = require('../../../../middleware/file-upload');
const controllers = require('../../../tickets/controllers');
const { ticketSchema } = require('../../../tickets/schema/ticketSchemas');
const { validateRequest } = require('../../../../configs/reqServices');
const controller = controllers.ticketController;

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

//  - base route for module
// - /api/1.0.0/cp/tickets

router.use(checkAuth, customerDataFilter);

router.get(`/settings`, controller.getTicketSettings);

router.get(`/`, checkNonSpCustomer, controller.getTickets);

router.get(`/:id`, controller.getTicket);

router.post(`/`, uploadHandler, validateRequest(ticketSchema()), checkMaxCount, imageOptimization, controller.postTicket);

router.patch(`/:id`, uploadHandler, validateRequest(ticketSchema()), checkMaxCount, imageOptimization, controller.patchTicket);

router.delete(`/:id`, controller.deleteTicket);

module.exports = router; 