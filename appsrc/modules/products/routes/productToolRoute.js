const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');

const controllers = require('../controllers');
const controller = controllers.productToolController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products

const baseRouteForObject = `/tools`; 

router.use(checkAuth);

router.get(`${baseRouteForObject}/:id`, controller.getProductTool);

router.get(`${baseRouteForObject}/`, controller.getProductTools);

router.post(`${baseRouteForObject}/`,  controller.postProductTool);

router.patch(`${baseRouteForObject}/:id`,  controller.patchProductTool);

router.delete(`${baseRouteForObject}/:id`, controller.deleteProductTool);

module.exports = router;