const express = require('express');
const checkAuth = require('../../../middleware/check-auth');
const controllers = require('../controllers');
const controller = controllers.impactController;
const router = express.Router();

const baseRoute = `/settings/impacts`;

router.use(checkAuth);

// router.get(`${baseRoute}/search`, controller.searchTicketImpacts );

router.get(`${baseRoute}/count`, controller.getTicketCountByImpact);

router.get(`${baseRoute}/:id`, controller.getTicketImpact);

router.get(`${baseRoute}/`, controller.getTicketImpacts);

router.post(`${baseRoute}/`, controller.postTicketImpact);

router.patch(`${baseRoute}/:id`, controller.patchTicketImpact);

router.delete(`${baseRoute}/:id`, controller.deleteTicketImpact);

module.exports = router;