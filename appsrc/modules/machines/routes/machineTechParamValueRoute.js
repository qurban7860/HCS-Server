const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');

const controllers = require('../controllers');
const controller = controllers.machineTechParamValueController;

const router = express.Router();
router.use(checkAuth);

router.get('/:id', controller.getMachineTechParamValue);

router.get('/', controller.getMachineTechParamValues);

router.post('/',  controller.postMachineTechParamValue);

router.patch('/:id',  controller.patchMachineTechParamValue);

router.delete('/:id', controller.deleteMachineTechParamValue);

module.exports = router;