const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const verifyDelete = require('../../../middleware/verifyDelete');

const controllers = require('../controllers');
const controller = controllers.productSupplierController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products

const baseRouteForObject = `/suppliers`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}/:id`, controller.getProductSupplier);

router.get(`${baseRouteForObject}/`, controller.getProductSuppliers);

router.post(`${baseRouteForObject}/`,  controller.postProductSupplier);

router.patch(`${baseRouteForObject}/:id`, verifyDelete, controller.patchProductSupplier);

router.delete(`${baseRouteForObject}/:id`, controller.deleteProductSupplier);

module.exports = router;