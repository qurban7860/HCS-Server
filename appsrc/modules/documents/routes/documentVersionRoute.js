const express = require('express');
const { check } = require('express-validator');
const { uploadHandler, checkMaxCount, imageOptimization } = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const { Customer } = require('../models');
const checkCustomerID = require('../../../middleware/check-parentID')('customer', Customer);
const checkCustomer = require('../../../middleware/check-customer');
const controllers = require('../controllers');
const controller = controllers.documentVersionController;

const router = express.Router();

const baseRoute = `/document`;

router.use(checkAuth, checkCustomer);

// - /api/1.0.0/documents/documentVersion/:id
router.get(`${baseRoute}/:documentid/versions/:id`,controller.getDocumentVersion);

// - /api/1.0.0/documents/documentVersion/
router.get(`${baseRoute}/:documentid/versions/`, controller.getDocumentVersions);

// - /api/1.0.0/documents/documentVersion/
router.post(`${baseRoute}/:documentid/versions/`, uploadHandler, checkMaxCount, imageOptimization, controller.postDocumentVersion);

// - /api/1.0.0/documents/documentVersion/:id
router.patch(`${baseRoute}/:documentid/versions/:id`, uploadHandler, checkMaxCount, imageOptimization, controller.patchDocumentVersion);

// - /api/1.0.0/documents/documentVersion/:id
router.delete(`${baseRoute}/:documentid/versions/:id`, controller.deleteDocumentVersion);

module.exports = router;