const express = require('express');
const { check } = require('express-validator');

const checkAuth = require('../../../middleware/check-auth');
const { Product } = require('../models');
// const checkProductID = require('../../../middleware/check-parentID')('machine', Product);
const checkCustomer = require('../../../middleware/check-customer');
// const verifyDelete = require('../../../middleware/verifyDelete');


const controllers = require('../controllers');
const controller = controllers.productIntegrationController;

const router = express.Router();

const baseRouteForObject = `/machines/:machineId/integration`;

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}`, controller.getIntegrationDetails);

router.post(`${baseRouteForObject}/portalkey`, controller.postIntegrationPortalKey);

router.post(`${baseRouteForObject}/details`, controller.postIntegrationDetails);


module.exports = router;