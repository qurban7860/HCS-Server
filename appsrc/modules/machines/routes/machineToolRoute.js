const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');

const controllers = require('../controllers');
const controller = controllers.machineToolController;

const router = express.Router();
router.use(checkAuth);

router.get('/:id', controller.getMachineTool);

router.get('/', controller.getMachineTools);

router.post('/',  controller.postMachineTool);

router.patch('/:id',  controller.patchMachineTool);

router.delete('/:id', controller.deleteMachineTool);

module.exports = router;