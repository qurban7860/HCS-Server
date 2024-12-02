const express = require('express');

const checkAuth = require('../../../../middleware/check-auth');
const checkCustomer = require('../../../../middleware/check-customer');

const controllers = require('../../controllers');
const controller = controllers.productTechParamReportController;

const router = express.Router();

const baseRouteForObject = `/techparamReport`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}/:id`, controller.getProductTechParam);

router.get(`${baseRouteForObject}/`, controller.getProductTechParamReport);

module.exports = router;