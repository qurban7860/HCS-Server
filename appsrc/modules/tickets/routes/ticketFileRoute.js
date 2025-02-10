const express = require('express');
const router = express.Router();
const { uploadHandler, checkMaxCount, imageOptimization } = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const checkIDs = require('../../../middleware/validateParamIDs');
const controllers = require('../controllers');
const controller = controllers.ticketFileController;
const validate = require('../utils/validate');

const baseRoute = `/:ticketId/files`; 

router.use(checkAuth);

router.get(`${baseRoute}/:id`, checkIDs( validate.ticketIdAndId ), controller.getTicketFile );

router.get(`${baseRoute}/`, checkIDs( validate.ticketId), controller.getTicketFiles );

router.post(`${baseRoute}/`, checkIDs( validate.ticket ), uploadHandler, checkMaxCount, imageOptimization, controller.postTicketFile );

router.delete(`${baseRoute}/:id/`, checkIDs( validate.ticketIdAndId ), controller.deleteTicketFile );

module.exports = router;