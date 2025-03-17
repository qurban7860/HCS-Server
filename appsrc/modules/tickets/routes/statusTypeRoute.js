const express = require('express');
const checkAuth = require('../../../middleware/check-auth');
const controllers = require('../controllers');
const controller = controllers.statusTypeController;
const router = express.Router();

const baseRoute = `/settings/statusTypes`;

router.use(checkAuth);

// router.get(`${baseRoute}/search`, controller.searchTicketStatusTypes );

router.get(`${baseRoute}/count`, controller.getTicketCountByStatusType);

router.get(`${baseRoute}/:id`, controller.getTicketStatusType);

router.get(`${baseRoute}/`, controller.getTicketStatusTypes);

router.post(`${baseRoute}/`, controller.postTicketStatusType);

router.patch(`${baseRoute}/:id`, controller.patchTicketStatusType);

router.delete(`${baseRoute}/:id`, controller.deleteTicketStatusType);

module.exports = router;