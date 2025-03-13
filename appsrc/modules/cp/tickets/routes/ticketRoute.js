const express = require('express');
const multer = require('multer');
const checkAuth = require('../../../../middleware/check-auth');
const validateCustomerInQuery = require('../../../../middleware/validateCustomerInQuery');
const validateCustomerInRequest = require('../../../../middleware/validateCustomerInRequest');
const removeProperties = require('../../../../middleware/removeProperties');
const customerDataFilter = require('../../../../middleware/customer-data-filter');
const { uploadHandler, checkMaxCount, imageOptimization } = require('../../../../middleware/file-upload');
const controllers = require('../../../tickets/controllers');
const { ticketSchema } = require('../../../tickets/schema/ticketSchemas');
const { validateRequest } = require('../../../../configs/reqServices');
const controller = controllers.ticketController;
const checkIDs = require('../../../../middleware/validateParamIDs');
const validateTicketID = require('../../../../middleware/validateTicketID');
const validate = require('../../utils/validate');
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

//  - base route for module
// - /api/1.0.0/cp/tickets

router.use(checkAuth, customerDataFilter);

router.get(`/settings`, controller.getTicketSettings);

router.get(`/`, validateCustomerInQuery, controller.getTickets);

router.get(`/:id`, validateTicketID("id"), validateCustomerInQuery, controller.getTicket);

router.post(`/`, uploadHandler, validateRequest(ticketSchema('new')), validateCustomerInRequest, removeProperties(["assignee", "approvers", "status"]), checkMaxCount, imageOptimization, controller.postTicket);

router.patch(`/:id`, validateTicketID("id"), uploadHandler, validateRequest(ticketSchema()), validateCustomerInRequest, removeProperties(["assignee", "approvers", "status"]), checkMaxCount, imageOptimization, controller.patchTicket);

// router.delete(`/:id`, validateTicketID("id"), controller.deleteTicket);

module.exports = router; 