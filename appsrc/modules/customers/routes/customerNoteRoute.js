const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');

const controllers = require('../controllers');
const controller = controllers.customerNoteController;

const router = express.Router();
// router.use(checkAuth);

router.get('/:id', controller.getCustomerNote);

router.get('/', controller.getCustomerNotes);

router.post('/',  controller.postCustomerNote);

router.patch('/:id',  controller.patchCustomerNote);

//router.patch('/:id', fileUpload.single('image'), this.cntrl.patchModel);

router.delete('/:id', controller.deleteCustomerNote);

module.exports = router;