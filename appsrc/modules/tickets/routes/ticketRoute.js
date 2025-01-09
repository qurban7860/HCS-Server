const express = require('express');
const checkAuth = require('../../../middleware/check-auth');
const { uploadHandler, checkMaxCount, imageOptimization } = require('../../../middleware/file-upload');
const controllers = require('../controllers');
const controller = controllers.ticketController;
const router = express.Router();

router.use( checkAuth );

// router.get(`/search`, controller.searchTickets );

router.get(`/:id`, controller.getTicket );

router.get(`/`, controller.getTickets );

router.post(`/`, uploadHandler, checkMaxCount, imageOptimization, controller.postTicket );

router.patch(`/:id`, uploadHandler, checkMaxCount, imageOptimization, controller.patchTicket );

router.delete(`/:id`, controller.deleteTicket );

module.exports = router;