const express = require('express');
const { check } = require('express-validator');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' })
const { fileUpload, uploadHandler, checkMaxCount, imageOptimization } = require('../../../middleware/file-upload');

const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const verifyDelete = require('../../../middleware/verifyDelete');

const controllers = require('../controllers');
const controller = controllers.productServiceReportValueController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products

const baseRouteForObject = `/machines/:machineId/serviceReportValues`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}/:id`, controller.getProductServiceReportValue);

router.get(`${baseRouteForObject}/`, controller.getProductServiceReportValues);

router.get(`${baseRouteForObject}/:serviceId/checkItems`, controller.getProductServiceReportCheckItems);

router.post(`${baseRouteForObject}/`,uploadHandler, checkMaxCount, imageOptimization, controller.postProductServiceReportValue );

router.patch(`${baseRouteForObject}/:id`, verifyDelete, uploadHandler, checkMaxCount, imageOptimization, controller.patchProductServiceReportValue, );

router.delete(`${baseRouteForObject}/:id`, controller.deleteProductServiceReportValue);

module.exports = router;