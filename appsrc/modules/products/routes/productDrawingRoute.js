const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const verifyDelete = require('../../../middleware/verifyDelete');

const controllers = require('../controllers');
const controller = controllers.productDrawingController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products

const baseRouteForObject = `/drawings`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}/:id`, controller.getProductDrawing);

router.get(`${baseRouteForObject}/`, controller.getProductDrawings);

router.post(`${baseRouteForObject}/`, controller.postProductDrawing);

router.patch(`${baseRouteForObject}/:id`, verifyDelete, controller.patchProductDrawing);

router.delete(`${baseRouteForObject}/:id`, controller.deleteProductDrawing);

module.exports = router;