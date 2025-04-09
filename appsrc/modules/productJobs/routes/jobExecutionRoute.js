const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');

const controllers = require('../controllers');
const controller = controllers.jobExecutionController;

const router = express.Router();

router.use(checkAuth, checkCustomer);

const basicRoute = 'jobExecutions';

router.get(`/${basicRoute}/`, controller.getJobExecutions);

router.get(`/${basicRoute}/:id`, controller.getJobExecution);

router.post(`/${basicRoute}/`, controller.postJobExecution);

router.patch(`/${basicRoute}/:id`, controller.patchJobExecution);

router.patch(`/${basicRoute}/:id/status`, controller.patchJobExecutionStatus);

router.delete(`/${basicRoute}/:id`, controller.deleteJobExecution);

module.exports = router;