const express = require('express');
const { check } = require('express-validator');

const checkAuth = require('../../../middleware/check-auth');
const roleCheck = require('../../../middleware/role-check');
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

router.use(checkAuth, roleCheck, checkCustomer);

router.get(`${baseRouteForObject}/export`, controller.exportProductsJSONforCSV);

router.get(`${baseRouteForObject}/`, controller.getProducts);

router.get(`${baseRouteForObject}/getMachinesAgainstCountries`, controller.getMachinesAgainstCountries);

router.get(`${baseRouteForObject}/machineCoordinates`, controller.getProductsSiteCoordinates);

router.get(`${baseRouteForObject}/getDecoilerProducts/`, controller.getConnectionProducts); 

router.get(`${baseRouteForObject}/:id`, controller.getProduct);

router.post(`${baseRouteForObject}`, controller.postProduct);

router.patch(`${baseRouteForObject}/:id`, verifyDelete, controller.patchProduct);

router.delete(`${baseRouteForObject}/:id`, controller.deleteProduct);

router.post(`${baseRouteForObject}/transferMachine/`, controller.transferOwnership);

router.post(`${baseRouteForObject}/moveMachine/`, controller.moveMachine);


module.exports = router;