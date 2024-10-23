const express = require('express');
const { check } = require('express-validator');

const checkAuth = require('../../../middleware/check-auth');
const { Product } = require('../models');
const checkProductID = require('../../../middleware/check-parentID')('machine', Product);
const checkCustomer = require('../../../middleware/check-customer');
// const verifyDelete = require('../../../middleware/verifyDelete');


const controllers = require('../controllers');
const controller = controllers.productIntegrationController;

const router = express.Router();

const baseRouteForObject = `/machines/:machineId/integration`;

const baseRouteForApi = `/machines/syncMachineConnection`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}`, checkProductID, controller.getIntegrationRecord);

router.post(`${baseRouteForObject}`, checkProductID, controller.postIntegrationRecord);

// router.patch(`${baseRouteForObject}/:id`, checkProductID, verifyDelete, controller.patchProductNote);

// router.delete(`${baseRouteForObject}/:id`, checkProductID, controller.deleteProductNote);

// router.get('/notes/search', controller.searchProductNotes);

module.exports = router;