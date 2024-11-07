const express = require('express');

const checkAuth = require('../../../../middleware/check-auth');
const checkCustomer = require('../../../../middleware/check-customer');
const verifyDelete = require('../../../../middleware/verifyDelete');

const controllers = require('../../controllers');
const controller = controllers.productServiceReportTemplateController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products

const baseRouteForObject = `/serviceReportTemplates`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}/:id`, controller.getProductServiceReportTemplate);

router.get(`${baseRouteForObject}/`, controller.getProductServiceReportTemplates);

router.get(`/machines/:machineId/serviceReportTemplates`, controller.getProductServiceReportTemplates);

router.post(`${baseRouteForObject}/`,  controller.postProductServiceReportTemplate);

router.patch(`${baseRouteForObject}/:id`, verifyDelete, controller.patchProductServiceReportTemplate);

router.delete(`${baseRouteForObject}/:id`, controller.deleteProductServiceReportTemplate);

module.exports = router;