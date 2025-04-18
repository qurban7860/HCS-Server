const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');
const controllers = require('../../controllers');
const controller = controllers.jobComponentExecutionStatusController;
const router = express.Router();

router.use(checkAuth);

const basicRoute = 'jobComponentExecutionStatuses';

router.get(`/${basicRoute}/`, controller.getJobComponentExecutionStatuses);

router.get(`/${basicRoute}/:id`, controller.getJobComponentExecutionStatuses);

router.post(`/${basicRoute}/`, controller.postJobComponentExecutionStatus);

router.patch(`/${basicRoute}/:id`, controller.patchJobComponentExecutionStatus);

router.delete(`/${basicRoute}/:id`, controller.deleteJobComponentExecutionStatus);

module.exports = router;