const express = require('express');
const { check } = require('express-validator');

const controllers = require('../controllers');
const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');

const router = express.Router();
this.cntrl = controllers.contactsController;


// router.use(checkAuth);

router.get('/:id', this.cntrl.getContact);

router.get('/', this.cntrl.getContacts);

router.post('/', fileUpload.single('image'), this.cntrl.postContact);

router.patch('/:id', fileUpload.single('image'), this.cntrl.patchContact);

router.delete('/:id', this.cntrl.deleteContact);

module.exports = router;