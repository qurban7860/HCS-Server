const express = require('express');
const checkAuth = require('../../../middleware/check-auth');
const controllers = require('../controllers');
const controller = controllers.statusController;
const router = express.Router();

const baseRoute = `/settings/statuses`;

router.use(checkAuth);

// router.get(`${baseRoute}/search`, controller.searchTicketStatuses );

router.get(`${baseRoute}/count`, controller.getTicketCountByStatus);

router.get(`${baseRoute}/:id`, controller.getTicketStatus);

router.get(`${baseRoute}/`, controller.getTicketStatuses);

router.post(`${baseRoute}/`, controller.postTicketStatus);

router.patch(`${baseRoute}/:id`, controller.patchTicketStatus);

router.delete(`${baseRoute}/:id`, controller.deleteTicketStatus);

module.exports = router;