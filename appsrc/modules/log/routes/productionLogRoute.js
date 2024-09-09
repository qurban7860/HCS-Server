const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');

const controllers = require('../controllers');
const controller = controllers.productionLogController;

const router = express.Router();

router.use(checkAuth, checkCustomer);


router.get(`/production/`, controller.getLogs);

router.get(`/production/graph`, controller.getLogsGraph);

router.get(`/production/:id`, controller.getLog);

router.post(`/production/`, controller.postLog);

router.post(`/production/multi`, controller.postLogMulti);

router.patch(`/production/:id`, controller.patchLog);

module.exports = router;