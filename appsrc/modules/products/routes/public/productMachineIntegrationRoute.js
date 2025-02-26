const express = require('express');

// const verifyDelete = require('../../../middleware/verifyDelete');


const controllers = require('../../controllers');
const controller = controllers.productIntegrationController;

const router = express.Router();

// const baseRouteForMachineApi = `/machines`; 

// router.post(`/syncMachineConnection`, controller.syncMachineConnection);
router.post(`/machineSync`, controller.syncMachineConnection);

module.exports = router;