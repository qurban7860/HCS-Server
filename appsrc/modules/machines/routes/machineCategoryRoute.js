const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');

const controllers = require('../controllers');
const controller = controllers.machineCategoryController;

const router = express.Router();
// router.use(checkAuth);

router.get('/:id', controller.getMachineCategory);

router.get('/', controller.getMachineCategories);

router.post('/',  controller.postMachineCategory);

router.patch('/:id',  controller.patchMachineCategory);

//router.patch('/:id', fileUpload.single('image'), this.cntrl.patchCustomer);

router.delete('/:id', controller.deleteMachineCategory);

module.exports = router;