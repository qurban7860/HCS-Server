const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');

const controllers = require('../controllers');
const controller = controllers.machineLicenseController;

const router = express.Router();
router.use(checkAuth);

router.get('/:id', controller.getMachineLicense);

router.get('/', controller.getMachineLicenses);

router.post('/',  controller.postMachineLicense);

router.patch('/:id',  controller.patchMachineLicense);

router.delete('/:id', controller.deleteMachineLicense);

module.exports = router;