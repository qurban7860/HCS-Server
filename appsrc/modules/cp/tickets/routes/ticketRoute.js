const express = require('express');
const multer = require('multer');
const checkAuth = require('../../../../middleware/check-auth');
const validateCustomerInQuery = require('../../../../middleware/validateCustomerInQuery');
const customerDataFilter = require('../../../../middleware/customer-data-filter');
const { uploadHandler, checkMaxCount, imageOptimization } = require('../../../../middleware/file-upload');
const controllers = require('../../../tickets/controllers');
const { ticketSchema } = require('../../../tickets/schema/ticketSchemas');
const { validateRequest } = require('../../../../configs/reqServices');
const controller = controllers.ticketController;
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

//  - base route for module
// - /api/1.0.0/cp/tickets

router.use(checkAuth, customerDataFilter);

router.get(`/settings`, controller.getTicketSettings);

router.get(`/`, validateCustomerInQuery, controller.getTickets);

router.get(`/:id`, checkIDs(validate.id), validateCustomerInQuery, controller.getTicket);

router.post(`/`, uploadHandler, validateRequest(ticketSchema('new')), checkMaxCount, imageOptimization, controller.postTicket);

router.patch(`/:id`, checkIDs(validate.id), uploadHandler, validateRequest(ticketSchema()), checkMaxCount, imageOptimization, controller.patchTicket);

router.delete(`/:id`, checkIDs(validate.id), controller.deleteTicket);

module.exports = router; 