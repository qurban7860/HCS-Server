const express = require('express');

const verifyMachineAuth = require('../../../../middleware/verifyMachineIntegration');
const controllers = require('../../controllers');
const controller = controllers.publicProductConfigurationController;
const { productConfigurationSchema } = require('../../schema/ProductConfiguratioValidations');
const { validateRequest } = require('../../../../configs/reqServices');
const router = express.Router();

// - /api/1.0.0/products/public/machineConfig

const baseRouteForObject = `/machineConfig`;

router.use(verifyMachineAuth);

router.post(`${baseRouteForObject}`, validateRequest(productConfigurationSchema('new')), controller.postProductConfiguration);

module.exports = router;