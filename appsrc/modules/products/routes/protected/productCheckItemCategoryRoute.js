const express = require('express');

const checkAuth = require('../../../../middleware/check-auth');
const checkCustomer = require('../../../../middleware/check-customer');
const verifyDelete = require('../../../../middleware/verifyDelete');

const controllers = require('../../controllers');
const controller = controllers.productCheckItemCategoryController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products

const baseRouteForObject = `/CheckItemCategories`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}/:id`, controller.getProductCheckItemCategory);

router.get(`${baseRouteForObject}/`, controller.getProductCheckItemCategories);

router.post(`${baseRouteForObject}/`, controller.postProductCheckItemCategory);

router.patch(`${baseRouteForObject}/:id`, verifyDelete, controller.patchProductCheckItemCategory);

router.delete(`${baseRouteForObject}/:id`, controller.deleteProductCheckItemCategory);

module.exports = router;