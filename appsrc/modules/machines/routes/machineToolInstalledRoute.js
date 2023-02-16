const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');

const controllers = require('../controllers');
const controller = controllers.machineToolInstalledController;

const router = express.Router();
router.use(checkAuth);

router.get('/:id', controller.getMachineToolInstalled);

router.get('/', controller.getMachineToolInstalledList);

router.post('/',  controller.postMachineToolInstalled);

router.patch('/:id',  controller.patchMachineToolInstalled);

router.delete('/:id', controller.deleteMachineToolInstalled);

module.exports = router;