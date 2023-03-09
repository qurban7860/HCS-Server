const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const { Machine } = require('../models');
const checkMachineID = require('../../../middleware/check-parentID')('machine', Machine);


const controllers = require('../controllers');
const controller = controllers.machineToolInstalledController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products/machines

const baseRouteForObject = `/machines/:machineId/toolsinstalled`; 

// EndPoint: {{baseUrl}}/products/machines/
// localhost://api/1.0.0/products/machines/ 
//localhost://api/1.0.0/products/search/

router.use(checkAuth);

router.get(`${baseRouteForObject}/:id`, checkMachineID, controller.getMachineToolInstalled);

router.get(`${baseRouteForObject}`, checkMachineID, controller.getMachineToolInstalledList);

router.post(`${baseRouteForObject}`, checkMachineID, controller.postMachineToolInstalled);

router.patch(`${baseRouteForObject}/:id`, checkMachineID, controller.patchMachineToolInstalled);

router.delete(`${baseRouteForObject}/:id`, checkMachineID, controller.deleteMachineToolInstalled);

router.get('/notes/search', controller.searchMachineToolInstalled);

module.exports = router;