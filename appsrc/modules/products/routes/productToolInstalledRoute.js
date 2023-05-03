const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const { Product } = require('../models');
const checkProductID = require('../../../middleware/check-parentID')('machine', Product);


const controllers = require('../controllers');
const controller = controllers.productToolInstalledController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products/machines

const baseRouteForObject = `/machines/:machineId/toolsinstalled`; 

// EndPoint: {{baseUrl}}/products/machines/
// localhost://api/1.0.0/products/machines/ 
//localhost://api/1.0.0/products/search/

router.use(checkAuth);

router.get(`${baseRouteForObject}/:id`, checkProductID, controller.getProductToolInstalled);

router.get(`${baseRouteForObject}`, checkProductID, controller.getProductToolInstalledList);

router.post(`${baseRouteForObject}`, checkProductID, controller.postProductToolInstalled);

router.patch(`${baseRouteForObject}/:id`, checkProductID, controller.patchProductToolInstalled);

router.delete(`${baseRouteForObject}/:id`, checkProductID, controller.deleteProductToolInstalled);

router.get('/notes/search', controller.searchProductToolInstalled);

module.exports = router;