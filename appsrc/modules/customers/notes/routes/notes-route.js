const express = require('express');
const { check } = require('express-validator');

const controllers = require('../controllers');
const fileUpload = require('../../../../middleware/file-upload');
const checkAuth = require('../../../../middleware/check-auth');

const router = express.Router();
this.cntrl = controllers.notesController;


// router.use(checkAuth);

router.get('/:id', this.cntrl.getNote);

router.get('/', this.cntrl.getNotes);

router.post('/', fileUpload.single('image'), this.cntrl.postNote);

router.patch('/:id', fileUpload.single('image'), this.cntrl.patchNote);

router.delete('/:id', this.cntrl.deleteNote);

module.exports = router;