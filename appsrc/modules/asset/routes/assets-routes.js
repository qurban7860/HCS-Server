const express = require('express');
const { check } = require('express-validator');

const controllers = require('../controllers');
const fileUpload = require('../../../../middleware/file-upload');
const checkAuth = require('../../../../middleware/check-auth');

const router = express.Router();


router.use(checkAuth);

router.post('/',fileUpload.single('image'), controllers.assetController.saveAsset);

router.delete('/:id', controllers.assetController.deleteAsset);

router.put('/:id', controllers.assetController.updateAsset);

router.get('/', controllers.assetController.getAssets);

router.get('/:id', controllers.assetController.getAssets);

module.exports = router;
