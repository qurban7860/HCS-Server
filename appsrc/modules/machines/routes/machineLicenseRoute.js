const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const checkMachineID = require('../../../middleware/check-parentID')('machine');


const controllers = require('../controllers');
const controller = controllers.machineLicenseController;

const router = express.Router();

const baseRoute = `/machines/:machineId/licenses`; 

router.use(checkAuth);

router.get(`${baseRoute}/:id`, checkMachineID, controller.getMachineLicense);

router.get(`${baseRoute}`, checkMachineID, controller.getMachineLicenses);

router.post(`${baseRoute}`, checkMachineID,  controller.postMachineLicense);

router.patch(`${baseRoute}/:id`, checkMachineID,  controller.patchMachineLicense);

router.delete(`${baseRoute}/:id`, checkMachineID, controller.deleteMachineLicense);

// router.get('machines/licenses/search', checkMachineID, controller.searchMachineLicenses);

module.exports = router;