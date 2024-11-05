const express = require('express');

const checkAuth = require('../../../../middleware/check-auth');
const { Product } = require('../../models');
const checkProductID = require('../../../../middleware/check-parentID')('machine', Product);
const checkCustomer = require('../../../../middleware/check-customer');


const controllers = require('../../controllers');
const controller = controllers.productConnectionController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products/machines

const baseRouteForObject = `/machines/connections`; 

// EndPoint: {{baseUrl}}/products/machines/
// localhost://api/1.0.0/products/machines/ 
//localhost://api/1.0.0/products/search/

router.use(checkAuth, checkCustomer);

router.post(`${baseRouteForObject}/:id/connect`, controller.connectMachine);

router.post(`${baseRouteForObject}/:id/disconnect`, controller.disconnectMachine);

router.get(`${baseRouteForObject}/`, controller.getConnectionProducts); 

router.get(`${baseRouteForObject}/:connectedMachine`, controller.getParentMachines); 

// db.getCollection('MachineConnections').find({connectedMachine: ObjectId("654e8a90bf181c38980c819d"), disconnectionDate: {$exists: false} }, {machine:1}).sort({_id: -1});



module.exports = router;