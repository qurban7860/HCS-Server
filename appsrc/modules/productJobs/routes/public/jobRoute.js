const express = require('express');
const controllers = require('../../controllers');
const verifyMachineIntegration = require('../../../../middleware/verifyMachineIntegration');
const controller = controllers.jobsController;
const router = express.Router();

router.use(verifyMachineIntegration);

router.get(`/`, controller.getJobs);

router.get(`/:id`, controller.getJob);

router.post(`/`, controller.postJob);

router.patch(`/:id`, controller.patchJob);

router.delete(`/:id`, controller.deleteJob);

module.exports = router;