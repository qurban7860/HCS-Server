const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const verifyDelete = require('../../../middleware/verifyDelete');

const controllers = require('../controllers');
const controller = controllers.productTechParamCategoryController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products

const baseRouteForObject = `/techparamcategories`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}/:id`, controller.getProductTechParamCategory);

router.get(`${baseRouteForObject}/`, controller.getProductTechParamCategories);

router.post(`${baseRouteForObject}/`,  controller.postProductTechParamCategory);

router.patch(`${baseRouteForObject}/:id`, verifyDelete, controller.patchProductTechParamCategory);

router.delete(`${baseRouteForObject}/:id`, controller.deleteProductTechParamCategory);

module.exports = router;