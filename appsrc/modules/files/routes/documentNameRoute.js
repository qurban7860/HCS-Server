const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const { Customer } = require('../models');
const checkCustomerID = require('../../../middleware/check-parentID')('customer', Customer);
const checkCustomer = require('../../../middleware/check-customer');



const controllers = require('../controllers');
const controller = controllers.documentNameController;

const router = express.Router();

//  - base route for module
// - /api/1.0.0/files/documentNames

const baseRoute = `/documentNames`;

router.use(checkAuth, checkCustomer);

// - /api/1.0.0/files/documentNames/:id
router.get(`${baseRoute}/:id`,controller.getDocumentName);

// - /api/1.0.0/files/documentNames/
router.get(`${baseRoute}/`, controller.getDocumentNames);

// - /api/1.0.0/files/documentNames/:id/files
router.get(`${baseRoute}/:id/files`, controller.getDocumentFiles);

// - /api/1.0.0/files/documentNames/
router.post(`${baseRoute}/`,controller.postDocumentName);

// - /api/1.0.0/files/documentNames/:id
router.patch(`${baseRoute}/:id`, controller.patchDocumentName);

// - /api/1.0.0/files/documentNames/:id
router.delete(`${baseRoute}/:id`, controller.deleteDocumentName);

module.exports = router;