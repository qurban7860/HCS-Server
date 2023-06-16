const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const { Product } = require('../models');
const checkProductID = require('../../../middleware/check-parentID')('machine', Product);
const checkCustomer = require('../../../middleware/check-customer');
const verifyDelete = require('../../../middleware/verifyDelete');


const controllers = require('../controllers');
const controller = controllers.productNoteController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products/machines

const baseRouteForObject = `/machines/:machineId/notes`; 

// EndPoint: {{baseUrl}}/products/machines/
// localhost://api/1.0.0/products/machines/ 
//localhost://api/1.0.0/products/search/

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}/:id`, checkProductID, controller.getProductNote);

router.get(`${baseRouteForObject}`, checkProductID, controller.getProductNotes);

router.post(`${baseRouteForObject}`, checkProductID, controller.postProductNote);

router.patch(`${baseRouteForObject}/:id`, checkProductID, verifyDelete, controller.patchProductNote);

router.delete(`${baseRouteForObject}/:id`, checkProductID, controller.deleteProductNote);

router.get('/notes/search', controller.searchProductNotes);

module.exports = router;