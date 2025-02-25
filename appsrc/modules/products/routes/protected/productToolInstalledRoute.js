const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');
const verifyDelete = require('../../../../middleware/verifyDelete');
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');

const controllers = require('../../controllers');
const controller = controllers.productToolInstalledController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products/machines

const baseRouteForObject = `/machines/:machineId/toolsinstalled`;

router.use(checkAuth);

router.get(`${baseRouteForObject}/search`, checkIDs(validate.machineId), controller.searchProductToolInstalled);

router.get(`${baseRouteForObject}/:id`, checkIDs(validate.machineId), controller.getProductToolInstalled);

router.get(`${baseRouteForObject}`, checkIDs(validate.machineId), controller.getProductToolInstalledList);

router.post(`${baseRouteForObject}`, checkIDs(validate.machineId), controller.postProductToolInstalled);

router.patch(`${baseRouteForObject}/:id`, checkIDs(validate.machineId), verifyDelete, controller.patchProductToolInstalled);

router.delete(`${baseRouteForObject}/:id`, checkIDs(validate.machineId), controller.deleteProductToolInstalled);


module.exports = router;