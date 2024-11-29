const express = require('express');
const { check } = require('express-validator');
const { uploadHandler, checkMaxCount, imageOptimization } = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const { Customer } = require('../models');
const checkCustomerID = require('../../../middleware/check-parentID')('customer', Customer);
const checkCustomer = require('../../../middleware/check-customer');
const controllers = require('../controllers');
const controller = controllers.documentFileController;

const router = express.Router();

const baseRoute = `/document`;

router.use(checkAuth, checkCustomer);

router.get(`/checkFileExistenceByETag/`, controller.checkFileExistenceByETag);

// - /api/1.0.0/documents/documentFile/:id
router.get(`/files/:id/download/`, controller.downloadDocumentFile);

// - /api/1.0.0/documents/documentFile/:id
router.get(`${baseRoute}/:documentid/versions/:versionid/files/:id`,controller.getDocumentFile);

// - /api/1.0.0/documents/documentFile/:id
router.get(`${baseRoute}/:documentid/versions/:versionid/files/:id/download/`, controller.downloadDocumentFile);

// - /api/1.0.0/documents/documentFile/
router.get(`${baseRoute}/:documentid/versions/:versionid/files/`, controller.getDocumentFiles);

// - /api/1.0.0/documents/documentFile/
router.post(`${baseRoute}/:documentid/versions/:versionid/files/`, uploadHandler, checkMaxCount, imageOptimization, controller.postDocumentFile);

// - /api/1.0.0/documents/documentFile/:id
router.patch(`${baseRoute}/:documentid/versions/:versionid/files/:id`, controller.patchDocumentFile);

// - /api/1.0.0/documents/documentFile/:id
router.delete(`${baseRoute}/:documentid/versions/:versionid/files/:id`, controller.deleteDocumentFile);

module.exports = router;