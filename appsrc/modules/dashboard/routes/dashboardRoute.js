const express = require('express');
const { check } = require('express-validator');

const controllers = require('../controllers');
const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const checkcustomerexcludeReports = require('../../../middleware/check-customer-exclude-Reports');

const router = express.Router();
const dashBoardController = controllers.dashboardController;


router.use(checkAuth, checkCustomer, checkcustomerexcludeReports);

router.get('/', dashBoardController.getData);
router.get('/machineCountries', dashBoardController.getMachineByCountries);
router.get('/machineModel', dashBoardController.getMachineByModels);
router.get('/machineYear', dashBoardController.getMachineByYears);
router.get('/getCount', dashBoardController.getCount);

module.exports = router;