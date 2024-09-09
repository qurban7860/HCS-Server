const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');

const controllers = require('../controllers');
const controller = controllers.wasteLogController;

const router = express.Router();

router.use(checkAuth, checkCustomer);

router.get(`/waste/`, controller.getLogs);

router.get(`/waste/graph`, controller.getLogsGraph);

router.get(`/waste/:id`, controller.getLog);

router.post(`/waste/`, controller.postLog);

router.post(`/waste/multi`, controller.postLogMulti);

router.patch(`/waste/:id`, controller.patchLog);

module.exports = router;