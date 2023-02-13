const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');

const controllers = require('../controllers');
const controller = controllers.customerController;

const router = express.Router();
// router.use(checkAuth);

router.get('/:id', controller.getCustomer);

router.get('/', controller.getCustomers);

router.post('/',  controller.postCustomer);

router.patch('/:id',  controller.patchCustomer);

router.delete('/:id', controller.deleteCustomer);

module.exports = router;