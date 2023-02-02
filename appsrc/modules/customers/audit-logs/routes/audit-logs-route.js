const express = require('express');
const { check } = require('express-validator');

const controllers = require('../controllers');
const fileUpload = require('../../../../middleware/file-upload');
const checkAuth = require('../../../../middleware/check-auth');

const router = express.Router();
this.cntrl = controllers.auditLogsController;


// router.use(checkAuth);

router.get('/:id', this.cntrl.getAuditLog);

router.get('/', this.cntrl.getAuditLogs);

router.post('/', fileUpload.single('image'), this.cntrl.postAuditLog);

router.patch('/:id', fileUpload.single('image'), this.cntrl.patchAuditLog);

router.delete('/:id', this.cntrl.deleteAuditLog);

module.exports = router;