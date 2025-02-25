const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');
const checkCustomer = require('../../../../middleware/check-customer');
const customerDataFilter = require('../../../../middleware/customer-data-filter');
const controllers = require('../../../products/controllers');
const controller = controllers.productModelController;
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');
const router = express.Router();

const baseRouteForObject = `/models`;

router.use(checkAuth, checkCustomer, customerDataFilter);

router.get(`${baseRouteForObject}/:id`, checkIDs(validate.id), controller.getProductModel);
router.get(`${baseRouteForObject}/`, controller.getProductModels);

module.exports = router; 