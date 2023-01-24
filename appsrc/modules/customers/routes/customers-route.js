const express = require('express');
const { check } = require('express-validator');

const { customerController } = require('../controllers');
const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');

const router = express.Router();
this.cntrl = customerController;


// router.use(checkAuth);

router.get('/:id', this.cntrl.getCustomer);

router.get('/', this.cntrl.getCustomers);

router.post('/', fileUpload.single('image'), this.cntrl.postCustomer);

router.patch('/:id', fileUpload.single('image'), this.cntrl.patchCustomer);

router.delete('/:id', this.cntrl.deleteCustomer);

module.exports = router;