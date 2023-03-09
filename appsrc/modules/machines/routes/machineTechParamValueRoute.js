const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const { Machine } = require('../models');
const checkMachineID = require('../../../middleware/check-parentID')('machine', Machine);

const controllers = require('../controllers');
const controller = controllers.machineTechParamValueController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products/machines

const baseRouteForObject = `/machines/:machineId/techparamvalues`; 

// EndPoint: {{baseUrl}}/products/machines/
// localhost://api/1.0.0/products/machines/ 
//localhost://api/1.0.0/products/search/

router.use(checkAuth);

router.get(`${baseRouteForObject}/:id`, controller.getMachineTechParamValue);

router.get(`${baseRouteForObject}/`, controller.getMachineTechParamValues);

router.post(`${baseRouteForObject}/`,  controller.postMachineTechParamValue);

router.patch(`${baseRouteForObject}/:id`,  controller.patchMachineTechParamValue);

router.delete(`${baseRouteForObject}/:id`, controller.deleteMachineTechParamValue);

router.get('/techparamvalues/search',  controller.searchMachineTechParamValues);


module.exports = router;