const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const { Machine } = require('../models');
const checkMachineID = require('../../../middleware/check-parentID')('machine', Machine);


const controllers = require('../controllers');
const controller = controllers.machineLicenseController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products/machines

const baseRouteForObject = `/machines/:machineId/licenses`; 

// EndPoint: {{baseUrl}}/products/machines/
// localhost://api/1.0.0/products/machines/ 
//localhost://api/1.0.0/products/machines/


router.use(checkAuth);

router.get(`${baseRouteForObject}/:id`, checkMachineID, controller.getMachineLicense);

router.get(`${baseRouteForObject}`, checkMachineID, controller.getMachineLicenses);

router.post(`${baseRouteForObject}`, checkMachineID,  controller.postMachineLicense);

router.patch(`${baseRouteForObject}/:id`, checkMachineID,  controller.patchMachineLicense);

router.delete(`${baseRouteForObject}/:id`, checkMachineID, controller.deleteMachineLicense);

router.get('/licenses/search', controller.searchMachineLicenses);

module.exports = router;