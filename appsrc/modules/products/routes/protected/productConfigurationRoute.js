const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');
const verifyDelete = require('../../../../middleware/verifyDelete');
const controllers = require('../../controllers');
const controller = controllers.productConfigurationController;
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');
const { validateRequest } = require('../../../../configs/reqServices');
const { productConfigurationSchema } = require('../../schema/ProductConfiguratioValidations');

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products/machines/:machineId/ini

const baseRouteForObject = `/machines/:machineId/ini`;

router.use(checkAuth);

// router.get(`${baseRouteForObject}/search`, controller.searchProductConfiguration);

router.get(`${baseRouteForObject}/:id`, checkIDs(validate.machineIdAndId), controller.getProductConfiguration);

router.get(`${baseRouteForObject}`, checkIDs(validate.machineId), controller.getProductConfigurations);

router.post(`${baseRouteForObject}`, checkIDs(validate.machineId), validateRequest(productConfigurationSchema('new')), controller.postProductConfiguration);

router.patch(`${baseRouteForObject}/:id`, checkIDs(validate.machineIdAndId), validateRequest(productConfigurationSchema()), verifyDelete, controller.patchProductConfiguration);

router.delete(`${baseRouteForObject}/:id`, checkIDs(validate.machineIdAndId), controller.deleteProductConfiguration);

module.exports = router;