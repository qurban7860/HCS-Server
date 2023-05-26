const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');

const controllers = require('../controllers');
const controller = controllers.productController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products/machines

const baseRouteForObject = `/machines`; 

// EndPoint: {{baseUrl}}/products/machines/
// localhost://api/1.0.0/products/machines/ 
//localhost://api/1.0.0/products/search/

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}/`, controller.getProducts);

router.get(`${baseRouteForObject}/getDecoilerProducts/`, controller.getDecoilerProducts); 

router.get(`${baseRouteForObject}/:id`, controller.getProduct);



router.post(`${baseRouteForObject}`, controller.postProduct);

router.patch(`${baseRouteForObject}/:id`, controller.patchProduct);

router.delete(`${baseRouteForObject}/:id`, controller.deleteProduct);

module.exports = router;