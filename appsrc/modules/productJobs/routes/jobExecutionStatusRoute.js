const express = require('express');
const checkAuth = require('../../../middleware/check-auth');

const controllers = require('../controllers');
const controller = controllers.jobExecutionStatusController;

const router = express.Router();

router.use(checkAuth);

const basicRoute = 'jobExecutionStatuses';

router.get(`/${basicRoute}/`, controller.getJobExecutionStatuses);

router.get(`/${basicRoute}/:id`, controller.getJobExecutionStatus);

router.post(`/${basicRoute}/`, controller.postJobExecutionStatus);

router.patch(`/${basicRoute}/:id`, controller.patchJobExecutionStatus);

router.delete(`/${basicRoute}/:id`, controller.deleteJobExecutionStatus);

module.exports = router;