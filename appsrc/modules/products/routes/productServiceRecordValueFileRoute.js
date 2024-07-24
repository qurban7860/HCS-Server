const express = require('express');
const router = express.Router();

const { uploadHandler, checkMaxCount, imageOptimization } = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const controllers = require('../controllers');
const controller = controllers.productServiceRecordValueFileController;

const baseRouteForObject = `/machines/:machineId/serviceRecordValues/files`; 

router.use(checkAuth, checkCustomer);

router.post(`${baseRouteForObject}/upload`, uploadHandler, checkMaxCount, imageOptimization, controller.postServiceRecordValueFiles );

router.get(`${baseRouteForObject}/`, controller.getProductServiceRecordValueFiles);

router.get(`${baseRouteForObject}/:id/download`, controller.downloadServiceRecordValueFile);

router.patch(`${baseRouteForObject}/:id/`, uploadHandler, checkMaxCount, imageOptimization, controller.patchServiceRecordValueFile );

router.delete(`${baseRouteForObject}/:id/`, controller.deleteServiceRecordValueFile);


module.exports = router;