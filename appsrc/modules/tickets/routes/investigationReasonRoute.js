const express = require('express');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const controllers = require('../controllers');
const controller = controllers.investigationReasonController;
const router = express.Router();

const baseRoute = `/settings/investigationReasons`; 

router.use(checkAuth);

// router.get(`${baseRoute}/search`, controller.searchTicketInvestigationReasons );

router.get(`${baseRoute}/:id`, checkCustomer, controller.getTicketInvestigationReason );

router.get(`${baseRoute}/`, controller.getTicketInvestigationReasons );

router.post(`${baseRoute}/`, checkCustomer, controller.postTicketInvestigationReason );

router.patch(`${baseRoute}/:id`, checkCustomer, controller.patchTicketInvestigationReason );

router.delete(`${baseRoute}/:id`, checkCustomer, controller.deleteTicketInvestigationReason );

module.exports = router;