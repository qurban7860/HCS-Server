const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const verifyDelete = require('../../../middleware/verifyDelete');

const controllers = require('../controllers');
const controller = controllers.productTechParamController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products

const baseRouteForObject = `/techparams`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}/:id`, controller.getProductTechParam);

router.get(`${baseRouteForObject}/`, controller.getProductTechParams);

router.post(`${baseRouteForObject}/`,  controller.postProductTechParam);

router.patch(`${baseRouteForObject}/:id`, verifyDelete, controller.patchProductTechParam);

router.delete(`${baseRouteForObject}/:id`, controller.deleteProductTechParam);

module.exports = router;