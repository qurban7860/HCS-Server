const express = require('express');
const router = express.Router();

const { uploadHandler, checkMaxCount, imageOptimization } = require('../../../../middleware/file-upload');
const checkAuth = require('../../../../middleware/check-auth');
const checkCustomer = require('../../../../middleware/check-customer');
const controllers = require('../../controllers');
const controller = controllers.productServiceReportValueFileController;

const baseRouteForObject = `/machines/:machineId/serviceReportValues/files`; 

router.use(checkAuth, checkCustomer);

router.post(`${baseRouteForObject}/`, uploadHandler, checkMaxCount, imageOptimization, controller.postServiceReportValueFiles );

router.get(`${baseRouteForObject}/`, controller.getProductServiceReportValueFiles);

router.get(`${baseRouteForObject}/:id/download`, controller.downloadServiceReportValueFile);

router.delete(`${baseRouteForObject}/:id/`, controller.deleteServiceReportValueFile);


module.exports = router;