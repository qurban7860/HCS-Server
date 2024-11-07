const express = require('express');

// const verifyDelete = require('../../../middleware/verifyDelete');


const controllers = require('../../controllers');
const controller = controllers.productIntegrationController;

const router = express.Router();

const baseRouteForMachineApi = `/machines`; 

router.post(`${baseRouteForMachineApi}/syncMachineConnection`, controller.syncMachineConnection);

module.exports = router;