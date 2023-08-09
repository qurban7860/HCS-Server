const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const { Customer } = require('../models');
const checkCustomerID = require('../../../middleware/check-parentID')('customer', Customer);
const checkCustomer = require('../../../middleware/check-customer');
const verifyDelete = require('../../../middleware/verifyDelete');



const controllers = require('../controllers');
const controller = controllers.emailController;

const router = express.Router();

//  - base route for module
// - /api/1.0.0/filemanager/documentNames

router.use(checkAuth, checkCustomer);


// - /api/1.0.0/emails/
router.get(`/`, controller.getEmails);

// - /api/1.0.0/emails/:id/
router.get(`/:id`, controller.getEmail);

module.exports = router;