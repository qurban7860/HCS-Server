const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');
const verifyDelete = require('../../../middleware/verifyDelete');
const checkcustomerexcludeReports = require('../../../middleware/check-customer-exclude-Reports');

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

router.get(`${baseRouteForObject}/export`, checkcustomerexcludeReports, controller.exportProductsJSONforCSV);

router.get(`${baseRouteForObject}/`, checkcustomerexcludeReports, controller.getProducts);

router.get(`${baseRouteForObject}/getMachinesAgainstCountries`, checkcustomerexcludeReports, controller.getMachinesAgainstCountries);

router.get(`${baseRouteForObject}/machineCoordinates`, checkcustomerexcludeReports, controller.getProductsSiteCoordinates);

router.get(`${baseRouteForObject}/getDecoilerProducts/`, checkcustomerexcludeReports, controller.getConnectionProducts); 

router.get(`${baseRouteForObject}/:id`, checkcustomerexcludeReports, controller.getProduct);

router.post(`${baseRouteForObject}`, checkcustomerexcludeReports, controller.postProduct);

router.patch(`${baseRouteForObject}/:id`, verifyDelete, checkcustomerexcludeReports, controller.patchProduct);

router.delete(`${baseRouteForObject}/:id`, checkcustomerexcludeReports, controller.deleteProduct);

router.post(`${baseRouteForObject}/transferMachine/`, checkcustomerexcludeReports, controller.transferOwnership);

router.post(`${baseRouteForObject}/moveMachine/`, checkcustomerexcludeReports, controller.moveMachine);


module.exports = router;