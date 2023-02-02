const express = require('express');
const { check } = require('express-validator');

const controllers = require('../controllers');
const fileUpload = require('../../../../middleware/file-upload');
const checkAuth = require('../../../../middleware/check-auth');

const router = express.Router();
this.cntrl = controllers.sitesController;


// router.use(checkAuth);

router.get('/:id', this.cntrl.getSite);

router.get('/', this.cntrl.getSites);

router.post('/', fileUpload.single('image'), this.cntrl.postSite);

router.patch('/:id', fileUpload.single('image'), this.cntrl.patchSite);

router.delete('/:id', this.cntrl.deleteSite);

module.exports = router;