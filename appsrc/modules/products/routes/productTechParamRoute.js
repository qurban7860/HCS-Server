const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');

const controllers = require('../controllers');
const controller = controllers.productTechParamController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products

const baseRouteForObject = `/techparams`; 

router.use(checkAuth);

router.get(`${baseRouteForObject}/:id`, controller.getProductTechParam);

router.get(`${baseRouteForObject}/`, controller.getProductTechParams);

router.post(`${baseRouteForObject}/`,  controller.postProductTechParam);

router.patch(`${baseRouteForObject}/:id`,  controller.patchProductTechParam);

router.delete(`${baseRouteForObject}/:id`, controller.deleteProductTechParam);

module.exports = router;