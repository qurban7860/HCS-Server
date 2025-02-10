const express = require('express');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const controllers = require('../controllers');
const controller = controllers.statusTypeController;
const router = express.Router();

const baseRoute = `/settings/statusTypes`; 

router.use(checkAuth );

// router.get(`${baseRoute}/search`, controller.searchTicketStatusTypes );

router.get(`${baseRoute}/:id`, checkCustomer, controller.getTicketStatusType );

router.get(`${baseRoute}/`, controller.getTicketStatusTypes );

router.post(`${baseRoute}/`, checkCustomer, controller.postTicketStatusType );

router.patch(`${baseRoute}/:id`, checkCustomer, controller.patchTicketStatusType );

router.delete(`${baseRoute}/:id`, checkCustomer, controller.deleteTicketStatusType );

module.exports = router;