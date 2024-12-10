const express = require('express');

const checkAuth = require('../../../../middleware/check-auth');
const checkCustomer = require('../../../../middleware/check-customer');
const verifyDelete = require('../../../../middleware/verifyDelete');

const controllers = require('../../controllers');
const controller = controllers.productServiceReportCommentController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products

const baseRouteForObject = `/serviceReport/:serviceReportId/serviceReportComments`; 

router.use(checkAuth, checkCustomer);

// router.get(`${baseRouteForObject}/:id`, controller.getProductServiceReportComment);

router.get(`${baseRouteForObject}/`, controller.getProductServiceReportComments);

router.post(`${baseRouteForObject}/`,  controller.postProductServiceReportComment);

router.patch(`${baseRouteForObject}/:id`, verifyDelete, controller.patchProductServiceReportComment);

router.delete(`${baseRouteForObject}/:id`, controller.deleteProductServiceReportComment);

router.get(`${baseRouteForObject}/stream`, controller.streamProductServiceReportComments);


module.exports = router;