const express = require('express');
const router = express.Router();

const { uploadHandler, checkMaxCount, imageOptimization } = require('../../../../middleware/file-upload');
const checkAuth = require('../../../../middleware/check-auth');
const checkCustomer = require('../../../../middleware/check-customer');
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');

const controllers = require('../../controllers');
const controller = controllers.productServiceReportValueFileController;

const baseRouteForObject = `/machines/:machineId/serviceReportValues/files`; 

router.use(checkAuth, checkCustomer);

router.post(`${baseRouteForObject}/`, checkIDs(validate.machine), uploadHandler, checkMaxCount, imageOptimization, controller.postServiceReportValueFiles );

router.get(`${baseRouteForObject}/`, checkIDs(validate.machine), controller.getProductServiceReportValueFiles);

router.get(`${baseRouteForObject}/:id/download`, checkIDs(validate.machineAndId), controller.downloadServiceReportValueFile);

router.delete(`${baseRouteForObject}/:id/`, checkIDs(validate.machineAndId), controller.deleteServiceReportValueFile);


module.exports = router;