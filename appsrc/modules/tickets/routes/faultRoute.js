const express = require('express');
const checkAuth = require('../../../middleware/check-auth');
const controllers = require('../controllers');
const controller = controllers.faultController;
const router = express.Router();

const baseRoute = `/settings/faults`;

router.use(checkAuth);

// router.get(`${baseRoute}/search`, controller.searchTicketFaults );

router.get(`${baseRoute}/count`, controller.getTicketCountByFault);

router.get(`${baseRoute}/:id`, controller.getTicketFault);

router.get(`${baseRoute}/`, controller.getTicketFaults);

router.post(`${baseRoute}/`, controller.postTicketFault);

router.patch(`${baseRoute}/:id`, controller.patchTicketFault);

router.delete(`${baseRoute}/:id`, controller.deleteTicketFault);

module.exports = router;