const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');
const controllers = require('../../../documents/controllers');
const controller = controllers.documentFileController;
const router = express.Router();
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');
const baseRoute = `/document`;

router.use(checkAuth);

// - /api/1.0.0/cp/documents/document/files/:id/download/
router.get(`${baseRoute}/files/:id/download/`, checkIDs(validate.id), controller.downloadDocumentFile);

module.exports = router;