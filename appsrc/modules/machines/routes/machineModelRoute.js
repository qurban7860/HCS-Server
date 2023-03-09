const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');

const controllers = require('../controllers');
const controller = controllers.machineModelController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products

const baseRouteForObject = `/models`; 

router.use(checkAuth);

router.get(`${baseRouteForObject}/:id`, controller.getMachineModel);

router.get(`${baseRouteForObject}/`, controller.getMachineModels);

router.post(`${baseRouteForObject}/`,  controller.postMachineModel);

router.patch(`${baseRouteForObject}/:id`,  controller.patchMachineModel);

router.delete(`${baseRouteForObject}/:id`, controller.deleteMachineModel);

module.exports = router;