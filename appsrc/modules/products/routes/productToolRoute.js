const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const verifyDelete = require('../../../middleware/verifyDelete');

const controllers = require('../controllers');
const controller = controllers.productToolController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products

const baseRouteForObject = `/tools`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}/:id`, controller.getProductTool);

router.get(`${baseRouteForObject}/`, controller.getProductTools);

router.post(`${baseRouteForObject}/`,  controller.postProductTool);

router.patch(`${baseRouteForObject}/:id`, verifyDelete, controller.patchProductTool);

router.delete(`${baseRouteForObject}/:id`, controller.deleteProductTool);

module.exports = router;