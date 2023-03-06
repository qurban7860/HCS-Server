const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const checkMachineID = require('../../../middleware/check-parentID')('machine');


const controllers = require('../controllers');
const controller = controllers.machineToolInstalledController;

const router = express.Router();

const baseRoute = `/machines/:machineId/toolsinstalled`; 

router.use(checkAuth);

router.get(`${baseRoute}/:id`, checkMachineID, controller.getMachineToolInstalled);

router.get(`${baseRoute}`, checkMachineID, controller.getMachineToolInstalledList);

router.post(`${baseRoute}`, checkMachineID, controller.postMachineToolInstalled);

router.patch(`${baseRoute}/:id`, checkMachineID, controller.patchMachineToolInstalled);

router.delete(`${baseRoute}/:id`, checkMachineID, controller.deleteMachineToolInstalled);

// router.get('machines/notes/search', checkMachineID, controller.searchMachineToolInstalled);

module.exports = router;