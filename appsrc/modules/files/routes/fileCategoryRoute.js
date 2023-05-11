const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const { Customer } = require('../models');
const checkCustomerID = require('../../../middleware/check-parentID')('customer', Customer);



const controllers = require('../controllers');
const controller = controllers.fileCategoryController;

const router = express.Router();

//  - base route for module
// - /api/1.0.0/files/categories

const baseRoute = `/categories`;

router.use(checkAuth);

// - /api/1.0.0/files/categories/:id
router.get(`${baseRoute}/:id`,controller.getFileCategory);

// - /api/1.0.0/files/categories/
router.get(`${baseRoute}/`, controller.getFileCategories);

// - /api/1.0.0/files/categories/
router.post(`${baseRoute}/`,controller.postFileCategory);

// - /api/1.0.0/files/categories/:id
router.patch(`${baseRoute}/:id`, controller.patchFileCategory);

// - /api/1.0.0/files/categories/:id
router.delete(`${baseRoute}/:id`, controller.deleteFileCategory);

module.exports = router;