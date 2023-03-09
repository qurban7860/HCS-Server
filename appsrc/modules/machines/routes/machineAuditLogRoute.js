const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');

const controllers = require('../controllers');
const controller = controllers.machineAuditLogController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products

const baseRouteForObject = `/auditlogs`; 

router.use(checkAuth);

router.get(`${baseRouteForObject}/:id`, controller.getMachineAuditLog);

router.get(`${baseRouteForObject}/`, controller.getMachineAuditLogs);

router.post(`${baseRouteForObject}/`,  controller.postMachineAuditLog);

router.patch(`${baseRouteForObject}/:id`,  controller.patchMachineAuditLog);

router.delete(`${baseRouteForObject}/:id`, controller.deleteMachineAuditLog);

module.exports = router;