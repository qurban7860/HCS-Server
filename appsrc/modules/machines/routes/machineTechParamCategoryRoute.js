const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');

const controllers = require('../controllers');
const controller = controllers.machineTechParamCategoryController;

const router = express.Router();
router.use(checkAuth);

router.get('/:id', controller.getMachineTechParamCategory);

router.get('/', controller.getMachineTechParamCategories);

router.post('/',  controller.postMachineTechParamCategory);

router.patch('/:id',  controller.patchMachineTechParamCategory);

router.delete('/:id', controller.deleteMachineTechParamCategory);

module.exports = router;