const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const { Product } = require('../models');
const checkProductID = require('../../../middleware/check-parentID')('machine', Product);
const checkCustomer = require('../../../middleware/check-customer');
const verifyDelete = require('../../../middleware/verifyDelete');


const controllers = require('../controllers');
const controller = controllers.productToolInstalledController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products/machines

const baseRouteForObject = `/machines/:machineId/toolsinstalled`; 

// EndPoint: {{baseUrl}}/products/machines/
// localhost://api/1.0.0/products/machines/ 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}/search`, controller.searchProductToolInstalled);

router.get(`${baseRouteForObject}/:id`, checkProductID, controller.getProductToolInstalled);

router.get(`${baseRouteForObject}`, checkProductID, controller.getProductToolInstalledList);

router.post(`${baseRouteForObject}`, checkProductID, controller.postProductToolInstalled);

router.patch(`${baseRouteForObject}/:id`, checkProductID, verifyDelete, controller.patchProductToolInstalled);

router.delete(`${baseRouteForObject}/:id`, checkProductID, controller.deleteProductToolInstalled);


module.exports = router;