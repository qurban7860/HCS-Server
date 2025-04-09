const express = require('express');
const checkAuth = require('../../../middleware/check-auth');
const controllers = require('../controllers');
const controller = controllers.jobsController;

const router = express.Router();

router.use(checkAuth);

const basicRoute = 'jobs';

router.get(`/${basicRoute}/`, controller.getJobs);

router.get(`/${basicRoute}/:id`, controller.getJob);

router.post(`/${basicRoute}/`, controller.postJob);

router.patch(`/${basicRoute}/:id`, controller.patchJob);

router.delete(`/${basicRoute}/:id`, controller.patchJob);

module.exports = router;