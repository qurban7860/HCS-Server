const express = require('express');
const { check } = require('express-validator');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' })
const { fileUpload, uploadHandler, checkMaxCount, imageOptimization } = require('../../../middleware/file-upload');

const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const verifyDelete = require('../../../middleware/verifyDelete');

const controllers = require('../controllers');
const controller = controllers.productServiceRecordValueController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products

const baseRouteForObject = `/machines/:machineId/serviceRecordValues`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}/:id`, controller.getProductServiceRecordValue);

router.get(`${baseRouteForObject}/`, controller.getProductServiceRecordValues);

router.get(`${baseRouteForObject}/:serviceId/checkItems`, controller.getProductServiceRecordCheckItems);

router.post(`${baseRouteForObject}/`,uploadHandler, checkMaxCount, imageOptimization, controller.postProductServiceRecordValue,  );

router.patch(`${baseRouteForObject}/:id`, verifyDelete, uploadHandler, checkMaxCount, imageOptimization, controller.patchProductServiceRecordValue, );

router.delete(`${baseRouteForObject}/:id`, controller.deleteProductServiceRecordValue);

module.exports = router;