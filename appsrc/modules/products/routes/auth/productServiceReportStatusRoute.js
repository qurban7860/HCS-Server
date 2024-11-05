const express = require('express');

const checkAuth = require('../../../../middleware/check-auth');
const checkCustomer = require('../../../../middleware/check-customer');
const verifyDelete = require('../../../../middleware/verifyDelete');

const controllers = require('../../controllers');
const controller = controllers.productServiceReportStatusController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products

const baseRouteForObject = `/productServiceReportStatus`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}/:id`, controller.getProductServiceReportStatus);

router.get(`${baseRouteForObject}/`, controller.getProductServiceReportStatuses);

router.post(`${baseRouteForObject}/`,  controller.postProductServiceReportStatus);

router.patch(`${baseRouteForObject}/:id`, verifyDelete, controller.patchProductServiceReportStatus);

router.delete(`${baseRouteForObject}/:id`, controller.deleteProductServiceReportStatus);

module.exports = router;