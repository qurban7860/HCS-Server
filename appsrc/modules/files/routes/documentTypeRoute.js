const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const { Customer } = require('../models');
const checkCustomerID = require('../../../middleware/check-parentID')('customer', Customer);
const checkCustomer = require('../../../middleware/check-customer');



const controllers = require('../controllers');
const controller = controllers.documentTypeController;

const router = express.Router();

//  - base route for module
// - /api/1.0.0/filemanager/documentType

const baseRoute = `/documentType`;

router.use(checkAuth, checkCustomer);

// - /api/1.0.0/filemanager/documentType/:id
router.get(`${baseRoute}/:id`,controller.getDocumentType);

// - /api/1.0.0/filemanager/documentType/
router.get(`${baseRoute}/`, controller.getDocumentType);

// - /api/1.0.0/filemanager/documentType/:id/files
router.get(`${baseRoute}/:id/files`, controller.getDocumentTypeFiles);

// - /api/1.0.0/filemanager/documentType/
router.post(`${baseRoute}/`,controller.postDocumentType);

// - /api/1.0.0/filemanager/documentType/:id
router.patch(`${baseRoute}/:id`, controller.patchDocumentType);

// - /api/1.0.0/filemanager/documentType/:id
router.delete(`${baseRoute}/:id`, controller.deleteDocumentType);

module.exports = router;