const express = require('express');
const { check } = require('express-validator');

// const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const { Customer } = require('../models');
const checkCustomerID = require('../../../middleware/check-parentID')('customer', Customer);
const checkCustomer = require('../../../middleware/check-customer');
const multer = require("multer");
const upload = multer({ dest: "uploads/" });


const controllers = require('../controllers');
const controller = controllers.fileController;

const router = express.Router();

//  - base route for module
// - /api/1.0.0/filemanager/files
const baseRoute = `/files`;


router.use(checkAuth, checkCustomer);

// - /api/1.0.0/filemanager/files/:id
router.get(`${baseRoute}/:id`,controller.getFile);

// - /api/1.0.0/filemanager/files/
router.get(`${baseRoute}/`, controller.getFiles);

// - /api/1.0.0/filemanager/files/
router.post(`${baseRoute}/`, upload.single('image'), controller.postFile);

// - /api/1.0.0/filemanager/files/:id
router.patch(`${baseRoute}/:id`, controller.patchFile);

// - /api/1.0.0/filemanager/files/:id
router.delete(`${baseRoute}/:id`, controller.deleteFile);

module.exports = router;