const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const { Machine } = require('../models');
const checkMachineID = require('../../../middleware/check-parentID')('machine', Machine);


const controllers = require('../controllers');
const controller = controllers.machineNoteController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products/machines

const baseRouteForObject = `/machines/:machineId/notes`; 

// EndPoint: {{baseUrl}}/products/machines/
// localhost://api/1.0.0/products/machines/ 
//localhost://api/1.0.0/products/search/

router.use(checkAuth);

router.get(`${baseRouteForObject}/:id`, checkMachineID, controller.getMachineNote);

router.get(`${baseRouteForObject}`, checkMachineID, controller.getMachineNotes);

router.post(`${baseRouteForObject}`, checkMachineID, controller.postMachineNote);

router.patch(`${baseRouteForObject}/:id`, checkMachineID, controller.patchMachineNote);

router.delete(`${baseRouteForObject}/:id`, checkMachineID, controller.deleteMachineNote);

router.get('/notes/search', controller.searchMachineNotes);

module.exports = router;