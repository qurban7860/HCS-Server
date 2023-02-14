const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');

const controllers = require('../controllers');
const controller = controllers.customerContactController;

const router = express.Router();
// router.use(checkAuth);

router.get('/:id', controller.getCustomerContact);

router.get('/', controller.getCustomerContacts);

router.get("/sp/data", controller.getSPCustomerContacts);

router.post('/',  controller.postCustomerContact);

router.patch('/:id',  controller.patchCustomerContact);

//router.patch('/:id', fileUpload.single('image'), this.cntrl.patchCustomer);

router.delete('/:id', controller.deleteCustomerContact);

module.exports = router;