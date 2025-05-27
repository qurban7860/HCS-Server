const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../../../../middleware/check-auth');
const checkCustomer = require('../../../../middleware/check-customer');
const controllers = require('../../controllers');
const controller = controllers.apiLogController;
const verifyDelete = require('../../../../middleware/verifyDelete');

const router = express.Router();

//  - base route for module
// - /api/1.0.0/apiclient/

const baseRouteForObject = `/logs/`;

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}summary`, controller.getApiLogSummary);

router.get(`${baseRouteForObject}:id`, controller.getApiLog);

router.get(`${baseRouteForObject}`, controller.getApiLogs);

router.post(`${baseRouteForObject}`, controller.postApiLog);

router.delete(`${baseRouteForObject}:id`, controller.deleteApiLog);


module.exports = router;