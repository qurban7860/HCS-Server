const express = require('express');
const { check } = require('express-validator');

const controllers = require('../controllers');
const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');

const router = express.Router();
this.cntrl = controllers.assetsController;


// router.use(checkAuth);

router.get('/:id', this.cntrl.getAsset);

router.get('/', this.cntrl.getAssets);

router.post('/', fileUpload.single('image'), this.cntrl.postAsset);

router.patch('/:id', fileUpload.single('image'), this.cntrl.patchAsset);

router.delete('/:id', this.cntrl.deleteAsset);

module.exports = router;