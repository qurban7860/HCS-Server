const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');

const controllers = require('../controllers');
const controller = controllers.productLogsController;

const router = express.Router();

router.use(checkAuth, checkCustomer);


//  - route information from parent
// - /api/1.0.0/products/machines

const baseRouteForObject = `/machines/:machineId/logs`; 


router.get(`${baseRouteForObject}/`, controller.getProductLogs);

router.get(`${baseRouteForObject}/:id`, controller.getProductLog);


router.post(`${baseRouteForObject}/`, controller.postProductLog);

router.patch(`${baseRouteForObject}/:id`, controller.patchProductLog);

module.exports = router;