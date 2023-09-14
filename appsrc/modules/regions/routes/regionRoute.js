const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../../../middleware/check-auth');
const { Region } = require('../models');
const checkCustomer = require('../../../middleware/check-customer');
const controllers = require('../controllers');
const controller = controllers.regionController;
const verifyDelete = require('../../../middleware/verifyDelete');

const router = express.Router();

//  - base route for module
// - /api/1.0.0/regions/

const baseRouteForObject = `/regions/`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}:id`, controller.getRegion);

router.get(`${baseRouteForObject}`, controller.getRegions);

router.post(`${baseRouteForObject}`, controller.postRegion);

router.patch(`${baseRouteForObject}:id`, verifyDelete, controller.patchRegion);

router.delete(`${baseRouteForObject}:id`, controller.deleteRegion);

module.exports = router;