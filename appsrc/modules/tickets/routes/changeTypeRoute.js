const express = require('express');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const controllers = require('../controllers');
const controller = controllers.changeTypeController;
const router = express.Router();

const baseRoute = `/settings/changeTypes`; 

router.use(checkAuth);

// router.get(`${baseRoute}/search`, controller.searchTicketChangeTypes );

router.get(`${baseRoute}/:id`, checkCustomer, controller.getTicketChangeType );

router.get(`${baseRoute}/`, controller.getTicketChangeTypes );

router.post(`${baseRoute}/`, checkCustomer, controller.postTicketChangeType );

router.patch(`${baseRoute}/:id`, checkCustomer, controller.patchTicketChangeType );

router.delete(`${baseRoute}/:id`, checkCustomer, controller.deleteTicketChangeType );

module.exports = router;