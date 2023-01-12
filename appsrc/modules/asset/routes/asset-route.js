const express = require('express');
const { check } = require('express-validator');

const controllers = require('../controllers');
const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');

const router = express.Router();
this.cntrl = controllers.assetController;

router.use(checkAuth);


router.post('/', fileUpload.single('image'), this.cntrl.postAsset);

router.get('/:id', this.cntrl.getAsset);

router.get('/', this.cntrl.getAssets);

router.put('/:id', fileUpload.single('image'), this.cntrl.putAsset);

router.delete('/:id', this.cntrl.deleteAsset);

module.exports = router;