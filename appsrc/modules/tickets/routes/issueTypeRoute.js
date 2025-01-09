const express = require('express');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const controllers = require('../controllers');
const controller = controllers.issueTypeController;
const router = express.Router();

const baseRoute = `/settings/issueTypes`; 

router.use(checkAuth);

// router.get(`${baseRoute}/search`, controller.searchTicketIssueTypes );

router.get(`${baseRoute}/:id`, checkCustomer, controller.getTicketIssueType );

router.get(`${baseRoute}/`, controller.getTicketIssueTypes );

router.post(`${baseRoute}/`, checkCustomer, controller.postTicketIssueType );

router.patch(`${baseRoute}/:id`, checkCustomer, controller.patchTicketIssueType );

router.delete(`${baseRoute}/:id`, checkCustomer, controller.deleteTicketIssueType );

module.exports = router;