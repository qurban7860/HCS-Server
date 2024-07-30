const express = require('express');
const { check } = require('express-validator');

const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const verifyDelete = require('../../../middleware/verifyDelete');

const controllers = require('../controllers');
const controller = controllers.productModelController;

const router = express.Router();

const baseRouteForObject = `/models`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}/:id`, controller.getProductModel);

router.get(`${baseRouteForObject}/`, controller.getProductModels);

router.post(`${baseRouteForObject}/`, controller.postProductModel);

router.patch(`${baseRouteForObject}/:id`, verifyDelete, controller.patchProductModel);

router.delete(`${baseRouteForObject}/:id`, controller.deleteProductModel);

module.exports = router;