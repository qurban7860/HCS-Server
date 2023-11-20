const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const verifyDelete = require('../../../middleware/verifyDelete');
const { Product } = require('../models');
const controllers = require('../controllers');
const controller = controllers.productConfigurationController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/productConfigurations

const baseRouteForObject = `/productConfigurations/`; 

router.use(checkAuth, checkCustomer);

// router.get(`${baseRouteForObject}/search`, controller.searchProductConfiguration);

router.get(`${baseRouteForObject}/:id`, controller.getProductConfiguration);

router.get(`${baseRouteForObject}`, controller.getProductConfigurations);

router.post(`${baseRouteForObject}`, controller.postProductConfiguration);

router.patch(`${baseRouteForObject}/:id`, verifyDelete, controller.patchProductConfiguration);

router.delete(`${baseRouteForObject}/:id`, controller.deleteProductConfiguration);

module.exports = router;