const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const { Product } = require('../models');
const checkProductID = require('../../../middleware/check-parentID')('machine', Product);
const checkCustomer = require('../../../middleware/check-customer');
const verifyDelete = require('../../../middleware/verifyDelete');

const controllers = require('../controllers');
const controller = controllers.productTechParamValueController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products/machines

const baseRouteForObject = `/machines/:machineId/techparamvalues`; 

// EndPoint: {{baseUrl}}/products/machines/
// localhost://api/1.0.0/products/machines/ 
//localhost://api/1.0.0/products/search/

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}/:id`, checkProductID, controller.getProductTechParamValue);

router.get(`${baseRouteForObject}/`, checkProductID, controller.getProductTechParamValues);

router.post(`${baseRouteForObject}/`, checkProductID,  controller.postProductTechParamValue);

router.patch(`${baseRouteForObject}/:id`, checkProductID,  controller.patchProductTechParamValue);

router.delete(`${baseRouteForObject}/:id`, checkProductID, verifyDelete, controller.deleteProductTechParamValue);

router.get('/techparamvalues/search',  controller.searchProductTechParamValues);


module.exports = router;