const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const verifyDelete = require('../../../middleware/verifyDelete');

const controllers = require('../controllers');
const controller = controllers.productServiceRecordsConfigController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products

const baseRouteForObject = `/serviceRecordsConfig`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}/:id`, controller.getProductServiceRecordsConfig);

router.get(`${baseRouteForObject}/`, controller.getProductServiceRecordsConfigs);

router.post(`${baseRouteForObject}/`,  controller.postProductServiceRecordsConfig);

router.patch(`${baseRouteForObject}/:id`, verifyDelete, controller.patchProductServiceRecordsConfig);

router.delete(`${baseRouteForObject}/:id`, controller.deleteProductServiceRecordsConfig);

module.exports = router;