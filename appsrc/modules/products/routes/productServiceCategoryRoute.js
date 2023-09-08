const express = require('express');

const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const verifyDelete = require('../../../middleware/verifyDelete');

const controllers = require('../controllers');
const controller = controllers.productServiceCategoryController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products

const baseRouteForObject = `/serviceCategories`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}/:id`, controller.getProductServiceCategory);

router.get(`${baseRouteForObject}/`, controller.getProductServiceCategories);

router.post(`${baseRouteForObject}/`, controller.postProductServiceCategory);

router.patch(`${baseRouteForObject}/:id`, verifyDelete, controller.patchProductServiceCategory);

router.delete(`${baseRouteForObject}/:id`, controller.deleteProductServiceCategory);

module.exports = router;