const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');

const controllers = require('../controllers');
const controller = controllers.machineAuditLogController;

const router = express.Router();
router.use(checkAuth);

router.get('/:id', controller.getMachineAuditLog);

router.get('/', controller.getMachineAuditLogs);

router.post('/',  controller.postMachineAuditLog);

router.patch('/:id',  controller.patchMachineAuditLog);

router.delete('/:id', controller.deleteMachineAuditLog);

module.exports = router;