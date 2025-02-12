const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');
const customerDataFilter = require('../../../../middleware/customer-data-filter');
const controllers = require('../../../products/controllers');
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');

const controller = controllers.productTechParamValueController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/cp/products/machines

const baseRouteForObject = `/machines/:machineId/techparamvalues`;

router.use(checkAuth, customerDataFilter);

router.get(`${baseRouteForObject}/softwareVersion`, checkIDs(validate.machineId), controller.getSoftwareVersion);

module.exports = router; 