const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../../../middleware/check-auth');

const checkCustomer = require('../../../middleware/check-customer');
const controllers = require('../controllers');
const controller = controllers.eventController;
const verifyDelete = require('../../../middleware/verifyDelete');

const router = express.Router();

//  - base route for module

const baseRouteForObject = `/events`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}/:id`, controller.getEvent);

router.get(`${baseRouteForObject}/`, controller.getEvents);

router.post(`${baseRouteForObject}`, controller.postEvent);

router.patch(`${baseRouteForObject}/:id`, verifyDelete, controller.patchEvent);

router.delete(`${baseRouteForObject}/:id`, controller.deleteEvent);

module.exports = router;