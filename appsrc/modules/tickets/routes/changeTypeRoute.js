const express = require('express');
const checkAuth = require('../../../middleware/check-auth');
const controllers = require('../controllers');
const controller = controllers.changeTypeController;
const router = express.Router();

const baseRoute = `/settings/changeTypes`;

router.use(checkAuth);

// router.get(`${baseRoute}/search`, controller.searchTicketChangeTypes );

router.get(`${baseRoute}/count`, controller.getTicketCountByChangeType);

router.get(`${baseRoute}/:id`, controller.getTicketChangeType);

router.get(`${baseRoute}/`, controller.getTicketChangeTypes);

router.post(`${baseRoute}/`, controller.postTicketChangeType);

router.patch(`${baseRoute}/:id`, controller.patchTicketChangeType);

router.delete(`${baseRoute}/:id`, controller.deleteTicketChangeType);

module.exports = router;