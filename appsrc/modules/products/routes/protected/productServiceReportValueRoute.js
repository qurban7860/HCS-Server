const express = require('express');

const { fileUpload, uploadHandler, checkMaxCount, imageOptimization } = require('../../../../middleware/file-upload');

const checkAuth = require('../../../../middleware/check-auth');
const checkCustomer = require('../../../../middleware/check-customer');
const verifyDelete = require('../../../../middleware/verifyDelete');
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');

const controllers = require('../../controllers');
const controller = controllers.productServiceReportValueController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products

const baseRouteForObject = `/machines/:machineId/serviceReportValues`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}/:id`, checkIDs(validate.machineAndId), controller.getProductServiceReportValue);

router.get(`${baseRouteForObject}/`, checkIDs(validate.machine), controller.getProductServiceReportValues);

router.get(`${baseRouteForObject}/:serviceReportId/checkItems`, checkIDs(validate.machine), controller.getProductServiceReportCheckItems);

router.post(`${baseRouteForObject}/`, checkIDs(validate.machine), uploadHandler, checkMaxCount, imageOptimization, controller.postProductServiceReportValue );

router.patch(`${baseRouteForObject}/:id`, checkIDs(validate.machineAndId), verifyDelete, uploadHandler, checkMaxCount, imageOptimization, controller.patchProductServiceReportValue, );

router.delete(`${baseRouteForObject}/:id`, checkIDs(validate.machineAndId), controller.deleteProductServiceReportValue);

module.exports = router;