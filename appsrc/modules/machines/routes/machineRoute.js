const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');

const controllers = require('../controllers');
const controller = controllers.machineController;

const router = express.Router();
router.use(checkAuth);

router.get('/:id', controller.getMachine);

router.get('/', controller.getMachines);

router.post('/',  controller.postMachine);

router.patch('/:id',  controller.patchMachine);

router.delete('/:id', controller.deleteMachine);

module.exports = router;