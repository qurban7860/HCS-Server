const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');

const controllers = require('../controllers');
const controller = controllers.machineSupplierController;

const router = express.Router();
router.use(checkAuth);

router.get('/:id', controller.getMachineSupplier);

router.get('/', controller.getMachineSuppliers);

router.post('/',  controller.postMachineSupplier);

router.patch('/:id',  controller.patchMachineSupplier);

router.delete('/:id', controller.deleteMachineSupplier);

module.exports = router;