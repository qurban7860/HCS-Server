const express = require('express');
const checkAuth = require('../../../middleware/check-auth');
const controllers = require('../controllers');
const controller = controllers.priorityController;
const router = express.Router();

const baseRoute = `/settings/priorities`;

router.use(checkAuth);

// router.get(`${baseRoute}/search`, controller.searchTicketPriorities );

router.get(`${baseRoute}/count`, controller.getTicketCountByPriority);

router.get(`${baseRoute}/:id`, controller.getTicketPriority);

router.get(`${baseRoute}/`, controller.getTicketPriorities);

router.post(`${baseRoute}/`, controller.postTicketPriority);

router.patch(`${baseRoute}/:id`, controller.patchTicketPriority);

router.delete(`${baseRoute}/:id`, controller.deleteTicketPriority);

module.exports = router;