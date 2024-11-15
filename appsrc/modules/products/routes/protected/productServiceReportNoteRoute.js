const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');
const checkCustomer = require('../../../../middleware/check-customer');
const verifyDelete = require('../../../../middleware/verifyDelete');
const controllers = require('../../controllers');
const controller = controllers.productServiceReportNoteController;

const router = express.Router();

// - /api/1.0.0/products

const baseRouteForObject = `/serviceReport/:serviceReportId/notes`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}/`, controller.getProductServiceReportNotes);

router.post(`${baseRouteForObject}/`,  controller.postProductServiceReportNote);

router.patch(`${baseRouteForObject}/:id`, verifyDelete, controller.patchProductServiceReportNote);

router.delete(`${baseRouteForObject}/:id`, controller.deleteProductServiceReportNote);

router.get(`${baseRouteForObject}/stream`, controller.streamProductServiceReportNotes);

module.exports = router;