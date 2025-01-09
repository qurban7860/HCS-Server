const express = require('express');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const controllers = require('../controllers');
const controller = controllers.impactController;
const router = express.Router();

const baseRoute = `/settings/impacts`; 

router.use(checkAuth);

// router.get(`${baseRoute}/search`, controller.searchTicketImpacts );

router.get(`${baseRoute}/:id`, checkCustomer, controller.getTicketImpact );

router.get(`${baseRoute}/`, controller.getTicketImpacts );

router.post(`${baseRoute}/`, checkCustomer, controller.postTicketImpact );

router.patch(`${baseRoute}/:id`, checkCustomer, controller.patchTicketImpact );

router.delete(`${baseRoute}/:id`, checkCustomer, controller.deleteTicketImpact );

module.exports = router;