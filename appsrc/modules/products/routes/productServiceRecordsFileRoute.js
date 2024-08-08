const express = require('express');
const router = express.Router();

const { uploadHandler, checkMaxCount, imageOptimization } = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const controllers = require('../controllers');
const controller = controllers.productServiceRecordsFileController;

const baseRouteForObject = `/machines/:machineId/serviceRecords/:id/files`; 

router.use(checkAuth, checkCustomer);

router.post(`${baseRouteForObject}/`, uploadHandler, checkMaxCount, imageOptimization, controller.postServiceRecordFiles );

router.get(`${baseRouteForObject}/`, controller.getProductServiceRecordFiles);

router.get(`${baseRouteForObject}/:fileId/download`, controller.downloadServiceRecordFile);

router.delete(`${baseRouteForObject}/:fileId/`, controller.deleteServiceRecordFile);

module.exports = router;