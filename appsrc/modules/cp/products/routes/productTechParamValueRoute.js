const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');
const roleCheck = require('../../../../middleware/role-check');
const checkCustomer = require('../../../../middleware/check-customer');
const customerDataFilter = require('../../../../middleware/customer-data-filter');
const { Product } = require('../../../products/models');
const checkProductID = require('../../../../middleware/check-parentID')('machine', Product);
const controllers = require('../../../products/controllers');
const controller = controllers.productTechParamValueController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/cp/products/machines

const baseRouteForObject = `/machines/:machineId/techparamvalues`; 

router.use(checkAuth, customerDataFilter);

router.get(`${baseRouteForObject}/softwareVersion`, checkProductID, controller.getSoftwareVersion);

module.exports = router; 