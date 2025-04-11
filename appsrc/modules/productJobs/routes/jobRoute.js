const express = require('express');
const checkAuth = require('../../../middleware/check-auth');
const controllers = require('../controllers');
const controller = controllers.jobsController;

const router = express.Router();

router.use(checkAuth);

router.get(`/`, controller.getJobs);

router.get(`/:id`, controller.getJob);

router.post(`/`, controller.postJob);

router.patch(`/:id`, controller.patchJob);

router.delete(`/:id`, controller.deleteJob);

module.exports = router;