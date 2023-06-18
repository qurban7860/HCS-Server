const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const verifyDelete = require('../../../middleware/verifyDelete');

const controllers = require('../controllers');
const controller = controllers.productAuditLogController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products

const baseRouteForObject = `/auditlogs`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}/:id`, controller.getProductAuditLog);

router.get(`${baseRouteForObject}/`, controller.getProductAuditLogs);

router.post(`${baseRouteForObject}/`, controller.postProductAuditLog);

router.patch(`${baseRouteForObject}/:id`, verifyDelete, controller.patchProductAuditLog);

router.delete(`${baseRouteForObject}/:id`, controller.deleteProductAuditLog);

module.exports = router;