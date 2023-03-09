const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');

const controllers = require('../controllers');
const controller = controllers.machineStatusController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products

const baseRouteForObject = `/statuses`; 

router.use(checkAuth);

router.get(`${baseRouteForObject}/:id`, controller.getMachineStatus);

router.get(`${baseRouteForObject}/`, controller.getMachineStatuses);

router.post(`${baseRouteForObject}/`,  controller.postMachineStatus);

router.patch(`${baseRouteForObject}/:id`,  controller.patchMachineStatus);

router.delete(`${baseRouteForObject}/:id`, controller.deleteMachineStatus);

module.exports = router;