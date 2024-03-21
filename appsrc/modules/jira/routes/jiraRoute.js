const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const controllers = require('../controllers');
const controller = controllers.jiraController;

const router = express.Router();

const baseRouteForObject = `/releases/`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}`, controller.getVersions);

module.exports = router;