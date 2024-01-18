const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');

const controllers = require('../controllers');
const controller = controllers.logFormatController;

const router = express.Router();

router.use(checkAuth, checkCustomer);

const basicRoute = 'logformat'; 

router.get(`/${basicRoute}/`, controller.getLogs);

router.get(`/${basicRoute}/:id`, controller.getLog);

router.post(`/${basicRoute}/`, controller.postLog);

router.patch(`/${basicRoute}/:id`, controller.patchLog);

module.exports = router;