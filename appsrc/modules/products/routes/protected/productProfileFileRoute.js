const express = require('express');

const checkAuth = require('../../../../middleware/check-auth');
const verifyDelete = require('../../../../middleware/verifyDelete');
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');
const controllers = require('../../controllers');
const controller = controllers.productProfileFileController;
const { uploadHandler, checkMaxCount, imageOptimization } = require('../../../../middleware/file-upload');

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products

const baseRouteForObject = `/machines/:machineId/profiles/:profileId/files/`;

router.use(checkAuth);

router.get(`${baseRouteForObject}/:id`, checkIDs(validate.machineIdProfileIdAndId), controller.downloadFile);

router.get(`${baseRouteForObject}`, checkIDs(validate.machineIdAndProfileId), controller.getProductProfileFiles);

router.post(`${baseRouteForObject}`, checkIDs(validate.machineIdAndProfileId), uploadHandler, checkMaxCount, imageOptimization, controller.postFiles);

router.patch(`${baseRouteForObject}/:id`, checkIDs(validate.machineIdProfileIdAndId), verifyDelete, controller.patchProductProfileFile);

router.delete(`${baseRouteForObject}/:id`, checkIDs(validate.machineIdProfileIdAndId), controller.deleteFile);

module.exports = router;