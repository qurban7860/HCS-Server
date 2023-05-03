const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');

const controllers = require('../controllers');
const controller = controllers.productCategoryController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products

const baseRouteForObject = `/categories`; 

router.use(checkAuth);

router.get(`${baseRouteForObject}/:id`, controller.getProductCategory);

router.get(`${baseRouteForObject}/`, controller.getProductCategories);

router.post(`${baseRouteForObject}/`,  controller.postProductCategory);

router.patch(`${baseRouteForObject}/:id`,  controller.patchProductCategory);

router.delete(`${baseRouteForObject}/:id`, controller.deleteProductCategory);

module.exports = router;