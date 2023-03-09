const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');

const controllers = require('../controllers');
const controller = controllers.machineController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products/machines

const baseRouteForObject = `/machines`; 

// EndPoint: {{baseUrl}}/products/machines/
// localhost://api/1.0.0/products/machines/ 
//localhost://api/1.0.0/products/search/

router.use(checkAuth);

router.get(`${baseRouteForObject}/:id`, controller.getMachine);

router.get(`${baseRouteForObject}/`, controller.getMachines);

router.post(`${baseRouteForObject}`,  controller.postMachine);

router.patch(`${baseRouteForObject}/:id`,  controller.patchMachine);

router.delete(`${baseRouteForObject}/:id`, controller.deleteMachine);

module.exports = router;