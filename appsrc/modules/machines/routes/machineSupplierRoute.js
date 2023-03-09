const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');

const controllers = require('../controllers');
const controller = controllers.machineSupplierController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products

const baseRouteForObject = `/suppliers`; 

router.use(checkAuth);

router.get(`${baseRouteForObject}/:id`, controller.getMachineSupplier);

router.get(`${baseRouteForObject}/`, controller.getMachineSuppliers);

router.post(`${baseRouteForObject}/`,  controller.postMachineSupplier);

router.patch(`${baseRouteForObject}/:id`,  controller.patchMachineSupplier);

router.delete(`${baseRouteForObject}/:id`, controller.deleteMachineSupplier);

module.exports = router;