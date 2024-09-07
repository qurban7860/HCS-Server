const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');

const controllers = require('../controllers');
const controller = controllers.logController;

const router = express.Router();

router.use(checkAuth, checkCustomer);


router.get(`/`, controller.getLogs);

router.get(`/graph`, controller.getLogsGraph);

router.get(`/:id`, controller.getLog);

router.post(`/`, controller.postLog);

router.post(`/multi`, controller.postLogMulti);

router.patch(`/:id`, controller.patchLog);

module.exports = router;