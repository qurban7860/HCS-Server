const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');
const checkCustomer = require('../../../../middleware/check-customer');
const controllers = require('../../../productLogs/controllers');
const controller = controllers.logController;
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');
const router = express.Router();

const baseRouteForObject = `/`;

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}`, controller.getLogs);
// GET /api/1.0.0/productLogs/

router.get(`/graph`, controller.getLogsGraph);
// GET /api/1.0.0/productLogs/graph

router.get(`/:id`, checkIDs(validate.id), controller.getLog);
// GET /api/1.0.0/productLogs/:id

module.exports = router; 