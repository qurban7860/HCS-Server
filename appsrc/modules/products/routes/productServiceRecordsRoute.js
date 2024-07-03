const express = require('express');
const { check } = require('express-validator');
const multer = require('multer');

const fileUpload = require('../../../middleware/file-upload');
const upload = multer({ dest: 'uploads/' })

const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const verifyDelete = require('../../../middleware/verifyDelete');

const controllers = require('../controllers');
const controller = controllers.productServiceRecordsController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products


const baseRouteForObject = `/machines/:machineId/serviceRecords`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}/:id`, controller.getProductServiceRecord);

router.post(`${baseRouteForObject}/:id/upload`, controller.postServiceRecordFile);

router.get(`${baseRouteForObject}/:id/files/:fileId/download`, controller.downloadServiceRecordFile);

router.patch(`${baseRouteForObject}/:id/files/:fileId/delete`, controller.deleteServiceRecordFile);

router.get(`${baseRouteForObject}/:id/values`, controller.getProductServiceRecordWithIndividualDetails);

router.get(`${baseRouteForObject}/`, controller.getProductServiceRecords);

router.post(`${baseRouteForObject}/`,upload.single('document'),  controller.postProductServiceRecord);

router.post(`${baseRouteForObject}/:id/sendEmail`, upload.single('pdf'), controller.sendServiceRecordEmail);

router.patch(`${baseRouteForObject}/:id`, [verifyDelete,upload.single('document')], controller.patchProductServiceRecord);

router.delete(`${baseRouteForObject}/:id`, controller.deleteProductServiceRecord);

module.exports = router;