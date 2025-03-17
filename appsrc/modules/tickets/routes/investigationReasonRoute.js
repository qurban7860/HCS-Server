const express = require('express');
const checkAuth = require('../../../middleware/check-auth');
const controllers = require('../controllers');
const controller = controllers.investigationReasonController;
const router = express.Router();

const baseRoute = `/settings/investigationReasons`;

router.use(checkAuth);

// router.get(`${baseRoute}/search`, controller.searchTicketInvestigationReasons );

router.get(`${baseRoute}/count`, controller.getTicketCountByInvestigationReason);

router.get(`${baseRoute}/:id`, controller.getTicketInvestigationReason);

router.get(`${baseRoute}/`, controller.getTicketInvestigationReasons);

router.post(`${baseRoute}/`, controller.postTicketInvestigationReason);

router.patch(`${baseRoute}/:id`, controller.patchTicketInvestigationReason);

router.delete(`${baseRoute}/:id`, controller.deleteTicketInvestigationReason);

module.exports = router;