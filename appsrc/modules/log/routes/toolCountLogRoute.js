const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');

const controllers = require('../controllers');
const controller = controllers.toolCountLogController;

const router = express.Router();

router.use(checkAuth, checkCustomer);


router.get(`/toolCount/`, controller.getLogs);

router.get(`/toolCount/graph`, controller.getLogsGraph);

router.get(`/toolCount/:id`, controller.getLog);

router.post(`/toolCount/`, controller.postLog);

router.post(`/toolCount/multi`, controller.postLogMulti);

router.patch(`/toolCount/:id`, controller.patchLog);

module.exports = router;