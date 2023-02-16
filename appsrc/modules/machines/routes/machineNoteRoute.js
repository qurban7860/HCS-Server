const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');

const controllers = require('../controllers');
const controller = controllers.machineNoteController;

const router = express.Router();
router.use(checkAuth);

router.get('/:id', controller.getMachineNote);

router.get('/', controller.getMachineNotes);

router.post('/',  controller.postMachineNote);

router.patch('/:id',  controller.patchMachineNote);

router.delete('/:id', controller.deleteMachineNote);

module.exports = router;