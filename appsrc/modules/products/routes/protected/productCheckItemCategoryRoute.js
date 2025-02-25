const express = require('express');

const checkAuth = require('../../../../middleware/check-auth');
const checkCustomer = require('../../../../middleware/check-customer');
const verifyDelete = require('../../../../middleware/verifyDelete');
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');

const controllers = require('../../controllers');
const controller = controllers.productCheckItemCategoryController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products

const baseRouteForObject = `/CheckItemCategories`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}/:id`, checkIDs(validate.id), controller.getProductCheckItemCategory);

router.get(`${baseRouteForObject}/`, controller.getProductCheckItemCategories);

router.post(`${baseRouteForObject}/`, controller.postProductCheckItemCategory);

router.patch(`${baseRouteForObject}/:id`, checkIDs(validate.id), verifyDelete, controller.patchProductCheckItemCategory);

router.delete(`${baseRouteForObject}/:id`, checkIDs(validate.id), controller.deleteProductCheckItemCategory);

module.exports = router;