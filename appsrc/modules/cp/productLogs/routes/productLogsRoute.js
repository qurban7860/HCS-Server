const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');
const checkCustomer = require('../../../../middleware/check-customer');
const controllers = require('../../../productLogs/controllers');
const controller = controllers.logController;

const router = express.Router();

//  - base route for module
// - /api/1.0.0/cp/productLogs

const baseRouteForObject = `/`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}`, controller.getLogs);
// GET /api/1.0.0/productLogs/

router.get(`/:id`, controller.getLog);
// GET /api/1.0.0/productLogs/:id

router.get(`/graph`, controller.getLogsGraph);
// GET /api/1.0.0/productLogs/graph

module.exports = router; 