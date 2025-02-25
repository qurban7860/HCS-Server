const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');
const validateCustomerInQuery = require('../../../../middleware/validateCustomerInQuery');
const controllers = require('../../../products/controllers');
const controller = controllers.productController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/cp/products/machines

const baseRouteForObject = `/machines`;

router.use(checkAuth);

router.get(`${baseRouteForObject}/`, validateCustomerInQuery, controller.getProducts);
router.get(`${baseRouteForObject}/:id`, checkIDs(validate.id), validateCustomerInQuery, controller.getProduct);

module.exports = router; 