const express = require('express');
const { check } = require('express-validator');

const controllers = require('../controllers');
const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');

const router = express.Router();
this.cntrl = controllers.dashboardController;


router.use(checkAuth, checkCustomer);

router.get('/machineCountries', this.cntrl.getMachineByCountries);
router.get('/machineModel', this.cntrl.getMachineByModels);
router.get('/machineYear', this.cntrl.getMachineByYears);
router.get('/getCount', this.cntrl.getCount);
router.get('/', this.cntrl.getData);

module.exports = router;