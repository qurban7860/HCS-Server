const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const verifyDelete = require('../../../middleware/verifyDelete');

const controllers = require('../controllers');
const controller = controllers.productStatusController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products

const baseRouteForObject = `/statuses`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}/:id`, controller.getProductStatus);

router.get(`${baseRouteForObject}/`, controller.getProductStatuses);

router.post(`${baseRouteForObject}/`,  controller.postProductStatus);

router.patch(`${baseRouteForObject}/:id`, verifyDelete, controller.patchProductStatus);

router.delete(`${baseRouteForObject}/:id`, controller.deleteProductStatus);

module.exports = router;