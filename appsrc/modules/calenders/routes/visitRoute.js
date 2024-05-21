const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../../../middleware/check-auth');

const checkCustomer = require('../../../middleware/check-customer');
const controllers = require('../controllers');
const controller = controllers.visitController;
const verifyDelete = require('../../../middleware/verifyDelete');

const router = express.Router();

//  - base route for module

const baseRouteForObject = `/visits`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}/:id`, controller.getVisit);

router.get(`${baseRouteForObject}/`, controller.getVisits);

router.post(`${baseRouteForObject}`, controller.postVisit);

router.patch(`${baseRouteForObject}/:id`, verifyDelete, controller.patchVisit);

router.delete(`${baseRouteForObject}/:id`, controller.deleteVisit);

module.exports = router;