const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const verifyDelete = require('../../../middleware/verifyDelete');

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

router.get(`${baseRouteForObject}/getMachinesAgainstCountries`, controller.getMachinesAgainstCountries);

router.get(`${baseRouteForObject}/machineCoordinates`, controller.getProductsSiteCoordinates);

router.get(`${baseRouteForObject}/getDecoilerProducts/`, controller.getConnectionProducts); 

router.get(`${baseRouteForObject}/:id`, controller.getProduct);

router.post(`${baseRouteForObject}`, controller.postProduct);

router.patch(`${baseRouteForObject}/:id`, verifyDelete, controller.patchProduct);

router.delete(`${baseRouteForObject}/:id`, controller.deleteProduct);

router.post(`${baseRouteForObject}/transferMachine/`, controller.transferOwnership);


module.exports = router;