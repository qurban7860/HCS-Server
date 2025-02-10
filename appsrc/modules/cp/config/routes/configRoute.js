const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../../../../middleware/check-auth');
const { Config } = require('../../../config/models');
const checkCustomer = require('../../../../middleware/check-customer');
const controllers = require('../../../config/controllers');
const controller = controllers.configController;

const router = express.Router();

//  - base route for module
// - /api/1.0.0/cp/config

const baseRouteForObject = `/`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}`, controller.getConfigs);

module.exports = router; 