const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');
const checkCustomer = require('../../../../middleware/check-customer');
const verifyDelete = require('../../../../middleware/verifyDelete');
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');

const controllers = require('../../controllers');
const controller = controllers.productServiceReportNoteController;

const router = express.Router();

// - /api/1.0.0/products

const baseRouteForObject = `/serviceReport/:serviceReportId/notes`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}/`, controller.getProductServiceReportNotes);

router.get(`${baseRouteForObject}/:id`, checkIDs(validate.id), controller.getProductServiceReportNote);

router.post(`${baseRouteForObject}/`,  controller.postProductServiceReportNote);

router.patch(`${baseRouteForObject}/:id`, checkIDs(validate.id), verifyDelete, controller.patchProductServiceReportNote);

router.delete(`${baseRouteForObject}/:id`, checkIDs(validate.id), controller.deleteProductServiceReportNote);

router.get(`${baseRouteForObject}/stream`, controller.streamProductServiceReportNotes);

module.exports = router;