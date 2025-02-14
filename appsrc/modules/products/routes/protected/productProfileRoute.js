const express = require('express');

const checkAuth = require('../../../../middleware/check-auth');
const checkCustomer = require('../../../../middleware/check-customer');
const verifyDelete = require('../../../../middleware/verifyDelete');
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');
const { Product } = require('../../models');
const checkProductID = require('../../../../middleware/check-parentID')('machine', Product);
const controllers = require('../../controllers');
const controller = controllers.productProfileController;
const { uploadHandler, checkMaxCount, imageOptimization } = require('../../../../middleware/file-upload');

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products

const baseRouteForObject = `/machines/:machineId/profiles`;

router.use(checkAuth, checkCustomer);

// router.get(`${baseRouteForObject}/search`, controller.searchProductProfile);

router.get(`${baseRouteForObject}/:id`, checkProductID, controller.getProductProfile);

router.get(`${baseRouteForObject}`, checkProductID, controller.getProductProfiles);

router.post(`${baseRouteForObject}`, checkProductID, uploadHandler, checkMaxCount, imageOptimization, controller.postProductProfile);

router.patch(`${baseRouteForObject}/:id`, checkProductID, verifyDelete, uploadHandler, checkMaxCount, imageOptimization, controller.patchProductProfile);

router.delete(`${baseRouteForObject}/:id`, checkProductID, controller.deleteProductProfile);

module.exports = router;