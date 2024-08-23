const express = require('express');
const checkAuth = require('../../../middleware/check-auth');
const { uploadHandler, checkMaxCount, imageOptimization } = require('../../../middleware/file-upload');
const checkCustomer = require('../../../middleware/check-customer');
const controllers = require('../controllers');
const controller = controllers.eventFileController;
const verifyDelete = require('../../../middleware/verifyDelete');

const router = express.Router();

const baseRouteForObject = `/events/:eventId/files`; 

router.use(checkAuth, checkCustomer);

router.post(`${baseRouteForObject}/`, uploadHandler, checkMaxCount, imageOptimization, controller.postEventFiles );

router.get(`${baseRouteForObject}/:id`, controller.downloadEventFile );

router.get(`${baseRouteForObject}/`, controller.getEventFiles );

router.patch(`${baseRouteForObject}/:id`, controller.deleteEventFile );

module.exports = router;