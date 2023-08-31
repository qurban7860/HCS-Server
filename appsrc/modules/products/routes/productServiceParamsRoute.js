const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const verifyDelete = require('../../../middleware/verifyDelete');

const controllers = require('../controllers');
const controller = controllers.productServiceParamsController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products

const baseRouteForObject = `/serviceParams`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}/:id`, controller.getProductServiceParam);

router.get(`${baseRouteForObject}/`, controller.getProductServiceParams);

router.post(`${baseRouteForObject}/`,  controller.postProductServiceParams);

router.patch(`${baseRouteForObject}/:id`, verifyDelete, controller.patchProductServiceParams);

router.delete(`${baseRouteForObject}/:id`, controller.deleteProductServiceParams);

module.exports = router;