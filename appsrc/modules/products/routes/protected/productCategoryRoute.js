const express = require('express');

const checkAuth = require('../../../../middleware/check-auth');
const checkCustomer = require('../../../../middleware/check-customer');
const verifyDelete = require('../../../../middleware/verifyDelete');
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');

const controllers = require('../../controllers');
const controller = controllers.productCategoryController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products

const baseRouteForObject = `/categories`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}/:id`, checkIDs(validate.id), checkIDs(validate.id), controller.getProductCategory);

router.get(`${baseRouteForObject}/`, controller.getProductCategories);

router.post(`${baseRouteForObject}/`, controller.postProductCategory);

router.patch(`${baseRouteForObject}/:id`, checkIDs(validate.id), checkIDs(validate.id), verifyDelete, controller.patchProductCategory);

router.delete(`${baseRouteForObject}/:id`, checkIDs(validate.id), checkIDs(validate.id), controller.deleteProductCategory);

module.exports = router;