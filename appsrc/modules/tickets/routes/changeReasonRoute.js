const express = require('express');
const checkAuth = require('../../../middleware/check-auth');
const controllers = require('../controllers');
const controller = controllers.changeReasonController;
const router = express.Router();

const baseRoute = `/settings/changeReasons`;

router.use(checkAuth);

// router.get(`${baseRoute}/search`, controller.searchTicketChangeReasons );

router.get(`${baseRoute}/count`, controller.getTicketCountByChangeReason);

router.get(`${baseRoute}/:id`, controller.getTicketChangeReason);

router.get(`${baseRoute}/`, controller.getTicketChangeReasons);

router.post(`${baseRoute}/`, controller.postTicketChangeReason);

router.patch(`${baseRoute}/:id`, controller.patchTicketChangeReason);

router.delete(`${baseRoute}/:id`, controller.deleteTicketChangeReason);

module.exports = router;