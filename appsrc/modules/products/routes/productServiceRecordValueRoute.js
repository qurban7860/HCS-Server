const express = require('express');
const { check } = require('express-validator');
const multer = require('multer');

const fileUpload = require('../../../middleware/file-upload');
const upload = multer({ dest: 'uploads/' })

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

router.post(`${baseRouteForObject}/`,upload.single('document'),  controller.postProductServiceRecordValue);

router.patch(`${baseRouteForObject}/:id`, [verifyDelete,upload.single('document')], controller.patchProductServiceRecordValue);

router.delete(`${baseRouteForObject}/:id`, controller.deleteProductServiceRecordValue);

module.exports = router;