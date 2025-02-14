const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');
const controllers = require('../../../documents/controllers');
const controller = controllers.documentFileController;
const router = express.Router();

const baseRoute = `/document`;

router.use(checkAuth);

router.get(`/checkFileExistenceByETag/`, controller.checkFileExistenceByETag);

// - /api/1.0.0/documents/documentFile/:id
router.get(`/files/:id/download/`, controller.downloadDocumentFile);

// - /api/1.0.0/documents/documentFile/:id
router.get(`${baseRoute}/:documentid/versions/:versionid/files/:id`, controller.getDocumentFile);

// - /api/1.0.0/documents/documentFile/:id
router.get(`${baseRoute}/:documentid/versions/:versionid/files/:id/download/`, controller.downloadDocumentFile);

// - /api/1.0.0/documents/documentFile/
router.get(`${baseRoute}/:documentid/versions/:versionid/files/`, controller.getDocumentFiles);

module.exports = router;