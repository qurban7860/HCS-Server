const express = require('express');

const verifyMachineAuth = require('../../../../middleware/verifyMachineIntegration');
const controllers = require('../../controllers');
const controller = controllers.productConfigurationController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/public/productConfigurations

const baseRouteForObject = `/productConfigurations`;

router.use(verifyMachineAuth);
router.post(`${baseRouteForObject}`, controller.postProductConfiguration);

module.exports = router;