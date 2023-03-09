const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');

const controllers = require('../controllers');
const controller = controllers.machineToolController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products

const baseRouteForObject = `/tools`; 

router.use(checkAuth);

router.get(`${baseRouteForObject}/:id`, controller.getMachineTool);

router.get(`${baseRouteForObject}/`, controller.getMachineTools);

router.post(`${baseRouteForObject}/`,  controller.postMachineTool);

router.patch(`${baseRouteForObject}/:id`,  controller.patchMachineTool);

router.delete(`${baseRouteForObject}/:id`, controller.deleteMachineTool);

module.exports = router;