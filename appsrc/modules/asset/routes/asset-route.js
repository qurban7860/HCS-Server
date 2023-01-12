const express = require('express');
const { check } = require('express-validator');

const controllers = require('../controllers');
const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');

const router = express.Router();
this.cntrl = controllers.assetController;

router.use(checkAuth);

router.post('/', fileUpload.single('image'), this.cntrl.saveAsset);

router.delete('/:id', this.cntrl.deleteAsset);

// router.put('/:id', fileUpload.single('image'), this.cntrl.updateAsset);

router.get('/', this.cntrl.getAssets);

// router.get('/:id', this.cntrl.getAssets);

module.exports = router;