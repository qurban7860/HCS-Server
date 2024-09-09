const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');

const controllers = require('../controllers');
const controller = controllers.coilLogController;

const router = express.Router();

router.use(checkAuth, checkCustomer);


router.get(`/coil/`, controller.getLogs);

router.get(`/coil/graph`, controller.getLogsGraph);

router.get(`/coil/:id`, controller.getLog);

router.post(`/coil/`, controller.postLog);

router.post(`/coil/multi`, controller.postLogMulti);

router.patch(`/coil/:id`, controller.patchLog);

module.exports = router;