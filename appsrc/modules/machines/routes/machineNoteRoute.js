const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const checkMachineID = require('../../../middleware/check-parentID')('machine');


const controllers = require('../controllers');
const controller = controllers.machineNoteController;

const router = express.Router();

const baseRoute = `/machines/:machineId/notes`; 

router.use(checkAuth);

router.get(`${baseRoute}/:id`, checkMachineID, controller.getMachineNote);

router.get(`${baseRoute}`, checkMachineID, controller.getMachineNotes);

router.post(`${baseRoute}`, checkMachineID, controller.postMachineNote);

router.patch(`${baseRoute}/:id`, checkMachineID, controller.patchMachineNote);

router.delete(`${baseRoute}/:id`, checkMachineID, controller.deleteMachineNote);

// router.get('machines/notes/search', checkMachineID, controller.searchMachineNotes);

module.exports = router;