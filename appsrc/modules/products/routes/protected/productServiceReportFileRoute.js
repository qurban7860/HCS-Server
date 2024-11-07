const express = require('express');
const router = express.Router();

const { uploadHandler, checkMaxCount, imageOptimization } = require('../../../../middleware/file-upload');
const checkAuth = require('../../../../middleware/check-auth');
const checkCustomer = require('../../../../middleware/check-customer');
const controllers = require('../../controllers');
const controller = controllers.productServiceReportFileController;

const baseRouteForObject = `/machines/:machineId/serviceReports/:id/files`; 

router.use(checkAuth, checkCustomer);

router.post(`${baseRouteForObject}/`, uploadHandler, checkMaxCount, imageOptimization, controller.postServiceReportFiles );

router.get(`${baseRouteForObject}/`, controller.getProductServiceReportFiles);

router.get(`${baseRouteForObject}/:fileId/download`, controller.downloadServiceReportFile);

router.delete(`${baseRouteForObject}/:fileId/`, controller.deleteServiceReportFile);

module.exports = router;