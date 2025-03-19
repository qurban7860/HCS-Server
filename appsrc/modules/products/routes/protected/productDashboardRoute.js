const express = require('express');

const checkAuth = require('../../../../middleware/check-auth');
const { Product } = require('../../models');
const checkProductID = require('../../../../middleware/check-parentID')('machine', Product);
const checkCustomer = require('../../../../middleware/check-customer');

const controllers = require('../../controllers');
const controller = controllers.productDashboardController;

const router = express.Router();

const baseRouteForObject = `/machines/:machineId/dashboard`;

router.use(checkAuth, checkCustomer);

// router.get(`${baseRouteForObject}`, checkProductID, controller.getProductDashboard);
router.get(`${baseRouteForObject}/producedLength`, checkProductID, controller.getProducedLength);
router.get(`${baseRouteForObject}/wasteLength`, checkProductID, controller.getWasteLength);
router.get(`${baseRouteForObject}/productionRate`, checkProductID, controller.getProductionRate);

module.exports = router;