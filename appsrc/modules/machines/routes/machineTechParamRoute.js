const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');

const controllers = require('../controllers');
const controller = controllers.machineTechParamController;

const router = express.Router();
router.use(checkAuth);

router.get('/:id', controller.getMachineTechParam);

router.get('/', controller.getMachineTechParams);

router.post('/',  controller.postMachineTechParam);

router.patch('/:id',  controller.patchMachineTechParam);

router.delete('/:id', controller.deleteMachineTechParam);

module.exports = router;