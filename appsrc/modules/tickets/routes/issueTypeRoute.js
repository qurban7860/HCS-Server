const express = require('express');
const checkAuth = require('../../../middleware/check-auth');
const controllers = require('../controllers');
const controller = controllers.issueTypeController;
const router = express.Router();

const baseRoute = `/settings/issueTypes`;

router.use(checkAuth);

// router.get(`${baseRoute}/search`, controller.searchTicketIssueTypes );

router.get(`${baseRoute}/count`, controller.getTicketCountByIssueType);

router.get(`${baseRoute}/:id`, controller.getTicketIssueType);

router.get(`${baseRoute}/`, controller.getTicketIssueTypes);

router.post(`${baseRoute}/`, controller.postTicketIssueType);

router.patch(`${baseRoute}/:id`, controller.patchTicketIssueType);

router.delete(`${baseRoute}/:id`, controller.deleteTicketIssueType);

module.exports = router;