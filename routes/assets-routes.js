const express = require('express');
const { check } = require('express-validator');

const controllers = require('../controllers');
const fileUpload = require('../middleware/file-upload');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();


router.use(checkAuth);

router.post('/saveAsset',fileUpload.single('image'), controllers.assetController.saveAsset);
router.post('/deleteAsset', controllers.assetController.deleteAsset);
router.post('/updateAsset',fileUpload.single('image'), controllers.assetController.updateAsset);

router.get('/getAllAssets', controllers.assetController.getAssets);



module.exports = router;
