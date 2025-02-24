const express = require('express');

const verifyMachineIntegration = require('../../../../middleware/verifyMachineIntegration');
const controllers = require('../../controllers');
const controller = controllers.productConfigurationController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/public/productConfigurations

const baseRouteForObject = `/productConfigurations`;


router.post(`${baseRouteForObject}`, verifyMachineIntegration, controller.postProductConfiguration);

module.exports = router;