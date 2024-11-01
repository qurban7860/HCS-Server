const express = require('express');
const { check } = require('express-validator');
const { uploadHandler, checkMaxCount, imageOptimization } = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const roleCheck = require('../../../middleware/role-check');

const { Customer } = require('../models');
const checkCustomerID = require('../../../middleware/check-parentID')('customer', Customer);
const checkCustomer = require('../../../middleware/check-customer');

const controllers = require('../controllers');
const controller = controllers.documentController;

const router = express.Router();

const baseRoute = `/document`;

router.use(checkAuth, roleCheck, checkCustomer);

// - /api/1.0.0/document/documents/getAllDocumentsAgainstFilter/
router.get(`${baseRoute}/allDocumentsAgainstFilter/`, controller.getImagesAgainstDocuments);

// - /api/1.0.0/document/documents/patchDocumentFilesETag/
router.put(`${baseRoute}/putDocumentFilesETag/`, controller.putDocumentFilesETag);

// - /api/1.0.0/document/documents/duplicateDrawings/
router.get(`${baseRoute}/dublicateDrawings/`, controller.getduplicateDrawings);

// - /api/1.0.0/documents/:id
router.get(`${baseRoute}/:id`,controller.getDocument);

// - /api/1.0.0/documents/
router.get(`${baseRoute}/`, controller.getDocuments);

// - /api/1.0.0/documents/
router.post(`${baseRoute}/`, uploadHandler, checkMaxCount, imageOptimization, controller.postDocument);

// - /api/1.0.0/documents/
router.post(`${baseRoute}multi/`, uploadHandler, checkMaxCount, imageOptimization, controller.postMultiDocument);
  
// - /api/1.0.0/documents/updatedVersion/:id
router.patch(`${baseRoute}/updatedVersion/:id`, controller.patchDocumentVersion);

// - /api/1.0.0/documents/:id
router.patch(`${baseRoute}/:id`,uploadHandler, checkMaxCount, imageOptimization, controller.patchDocument);

// - /api/1.0.0/documents/files/:id
router.delete(`${baseRoute}/:id`, controller.deleteDocument);

module.exports = router;