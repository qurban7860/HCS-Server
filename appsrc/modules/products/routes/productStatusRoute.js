const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');

const controllers = require('../controllers');
const controller = controllers.productStatusController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products

const baseRouteForObject = `/statuses`; 

router.use(checkAuth);

router.get(`${baseRouteForObject}/:id`, controller.getProductStatus);

router.get(`${baseRouteForObject}/`, controller.getProductStatuses);

router.post(`${baseRouteForObject}/`,  controller.postProductStatus);

router.patch(`${baseRouteForObject}/:id`,  controller.patchProductStatus);

router.delete(`${baseRouteForObject}/:id`, controller.deleteProductStatus);

module.exports = router;