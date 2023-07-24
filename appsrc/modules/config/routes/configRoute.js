const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../../../middleware/check-auth');
const { Config } = require('../models');
const checkCustomer = require('../../../middleware/check-customer');
const controllers = require('../controllers');
const controller = controllers.configController;
const verifyDelete = require('../../../middleware/verifyDelete');

const router = express.Router();

//  - base route for module
// - /api/1.0.0/configs/

const baseRouteForObject = `/`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}:id`, controller.getConfig);

router.get(`${baseRouteForObject}/`, controller.getConfigs);

router.post(`${baseRouteForObject}`, controller.postConfig);

router.patch(`${baseRouteForObject}:id`, verifyDelete, controller.patchConfig);

router.delete(`${baseRouteForObject}:id`, controller.deleteConfig);

module.exports = router;