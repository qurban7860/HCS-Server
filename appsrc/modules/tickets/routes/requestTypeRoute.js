const express = require('express');
const checkAuth = require('../../../middleware/check-auth');
const controllers = require('../controllers');
const controller = controllers.requestTypeController;
const router = express.Router();

const baseRoute = `/settings/requestTypes`;

router.use(checkAuth);

// router.get(`${baseRoute}/search`, controller.searchTicketIssueTypes );

router.get(`${baseRoute}/count`, controller.getTicketCountByRequestType);

router.get(`${baseRoute}/:id`, controller.getTicketRequestType);

router.get(`${baseRoute}/`, controller.getTicketRequestTypes);

router.post(`${baseRoute}/`, controller.postTicketRequestType);

router.patch(`${baseRoute}/:id`, controller.patchTicketRequestType);

router.delete(`${baseRoute}/:id`, controller.deleteTicketRequestType);

module.exports = router;