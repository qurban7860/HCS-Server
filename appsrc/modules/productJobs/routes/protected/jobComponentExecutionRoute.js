const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');
const controllers = require('../../controllers');
const controller = controllers.jobComponentExecutionController;
const router = express.Router();

router.use(checkAuth);

const basicRoute = 'jobComponentExecutions';

router.get(`/${basicRoute}/`, controller.getJobComponentExecutions);

router.get(`/${basicRoute}/:id`, controller.getJobComponentExecution);

router.post(`/${basicRoute}/`, controller.postJobComponentExecution);

router.patch(`/${basicRoute}/:id`, controller.patchJobComponentExecution);

router.patch(`/${basicRoute}/:jobComponentExecution/status/:id`, controller.patchJobComponentExecutionStatus);

router.delete(`/${basicRoute}/:id`, controller.deleteJobComponentExecution);

module.exports = router;