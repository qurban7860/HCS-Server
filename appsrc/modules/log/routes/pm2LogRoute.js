const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');

const controllers = require('../controllers');
const controller = controllers.pm2LogController;

const router = express.Router();

router.use(checkAuth, checkCustomer);

const basicRoute = 'pm2'; 

router.get(`/${basicRoute}/pm2list`, controller.getPM2List);

router.get(`/${basicRoute}/`, controller.getPM2Logs);

module.exports = router;