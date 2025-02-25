const express = require('express');

const checkAuth = require('../../../../middleware/check-auth');
const checkCustomer = require('../../../../middleware/check-customer');
const verifyDelete = require('../../../../middleware/verifyDelete');
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');

const controllers = require('../../controllers');
const controller = controllers.productAuditLogController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products

const baseRouteForObject = `/machines/:machineId/auditlogs`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}/:id`, checkIDs(validate.id), controller.getProductAuditLog);

router.get(`${baseRouteForObject}/`, controller.getProductAuditLogs);

router.post(`${baseRouteForObject}/`, controller.postProductAuditLog);

router.patch(`${baseRouteForObject}/:id`, checkIDs(validate.id), verifyDelete, controller.patchProductAuditLog);

router.delete(`${baseRouteForObject}/:id`, checkIDs(validate.id), controller.deleteProductAuditLog);

module.exports = router;