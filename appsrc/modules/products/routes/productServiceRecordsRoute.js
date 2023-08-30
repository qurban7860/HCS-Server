const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const verifyDelete = require('../../../middleware/verifyDelete');

const controllers = require('../controllers');
const controller = controllers.productServiceRecordsController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products

const baseRouteForObject = `/serviceRecords`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}/:id`, controller.getProductServiceRecord);

router.get(`${baseRouteForObject}/`, controller.getProductServiceRecords);

router.post(`${baseRouteForObject}/`,  controller.postProductServiceRecord);

router.patch(`${baseRouteForObject}/:id`, verifyDelete, controller.patchProductServiceRecord);

router.delete(`${baseRouteForObject}/:id`, controller.deleteProductServiceRecord);

module.exports = router;