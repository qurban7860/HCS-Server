const express = require('express');
const checkAuth = require('../../../middleware/check-auth');
const { uploadHandler, checkMaxCount, imageOptimization } = require('../../../middleware/file-upload');
const checkCustomer = require('../../../middleware/check-customer');
const controllers = require('../controllers');
const controller = controllers.eventController;
const verifyDelete = require('../../../middleware/verifyDelete');

const router = express.Router();

const baseRouteForObject = `/events`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}/:id`, controller.getEvent);

router.get(`${baseRouteForObject}/`, controller.getEvents);

router.post(`${baseRouteForObject}`, uploadHandler, checkMaxCount, imageOptimization, controller.postEvent);

router.patch(`${baseRouteForObject}/:id`, uploadHandler, checkMaxCount, imageOptimization, verifyDelete, controller.patchEvent );

router.delete(`${baseRouteForObject}/:id`, controller.deleteEvent);

module.exports = router;