const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');

const controllers = require('../controllers');
const controller = controllers.machineModelController;

const router = express.Router();
router.use(checkAuth);

router.get('/:id', controller.getMachineModel);

router.get('/', controller.getMachineModels);

router.post('/',  controller.postMachineModel);

router.patch('/:id',  controller.patchMachineModel);

router.delete('/:id', controller.deleteMachineModel);

module.exports = router;