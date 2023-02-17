const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');

const controllers = require('../controllers');
const controller = controllers.machineStatusController;

const router = express.Router();
router.use(checkAuth);

router.get('/:id', controller.getMachineStatus);

router.get('/', controller.getMachineStatuses);

router.post('/',  controller.postMachineStatus);

router.patch('/:id',  controller.patchMachineStatus);

router.delete('/:id', controller.deleteMachineStatus);

module.exports = router;