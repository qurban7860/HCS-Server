const express = require('express');
const multer = require('multer');
const { uploadHandler, checkMaxCount, imageOptimization } = require('../../../../middleware/file-upload');
const upload = multer({ dest: 'uploads/' })
const checkAuth = require('../../../../middleware/check-auth');
const checkCustomer = require('../../../../middleware/check-customer');
const verifyDelete = require('../../../../middleware/verifyDelete');
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');

const controllers = require('../../controllers');
const controller = controllers.productServiceReportController;
const postServiceReportFiles = controllers.productServiceReportFileController.postServiceReportFiles;
const router = express.Router();

const baseRouteForObject = `/machines/:machineId/serviceReports`;

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}/:id`, controller.getProductServiceReport);

router.get(`${baseRouteForObject}/:id/values`, controller.getProductServiceReportWithIndividualDetails);

router.get(`${baseRouteForObject}/`, controller.getProductServiceReports);

router.post(`${baseRouteForObject}/`, upload.single('document'), controller.postProductServiceReport, checkMaxCount, imageOptimization, postServiceReportFiles);

router.post(`${baseRouteForObject}/:id/sendEmail`, upload.single('pdf'), controller.sendServiceReportEmail);

router.post(`${baseRouteForObject}/:id/sendApprovalEmail`, controller.sendServiceReportApprovalEmail);

router.post(`${baseRouteForObject}/:id/approveReport`, controller.evaluateServiceReport);

router.get(`${baseRouteForObject}/:id/sendToDraft`, controller.sendToDraftServiceReport);

router.patch(`${baseRouteForObject}/:id/status/`, controller.changeProductServiceReportStatus);

router.patch(`${baseRouteForObject}/:id`, [verifyDelete, upload.single('document')], controller.patchProductServiceReport);


router.delete(`${baseRouteForObject}/:id`, controller.deleteProductServiceReport);

module.exports = router;