const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const { Customer } = require('../models');
const checkCustomerID = require('../../../middleware/check-parentID')('customer', Customer);
const checkCustomer = require('../../../middleware/check-customer');
const verifyDelete = require('../../../middleware/verifyDelete');


const controllers = require('../controllers');
const controller = controllers.documentCategoryController;

const router = express.Router();

//  - base route for module
// - /api/1.0.0/documents/categories

const baseRoute = `/categories`;

router.use(checkAuth, checkCustomer);

// - /api/1.0.0/documents/categories/:id
router.get(`${baseRoute}/:id`,controller.getDocumentCategory);

// - /api/1.0.0/documents/categories/
router.get(`${baseRoute}/`, controller.getDocumentCategories);

// - /api/1.0.0/documents/categories/
router.post(`${baseRoute}/`,controller.postDocumentCategory);

// - /api/1.0.0/documents/categories/:id
router.patch(`${baseRoute}/:id`, verifyDelete, controller.patchDocumentCategory);

// - /api/1.0.0/documents/categories/:id
router.delete(`${baseRoute}/:id`, controller.deleteDocumentCategory);

module.exports = router;