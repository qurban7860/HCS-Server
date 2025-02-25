const express = require('express');

const checkAuth = require('../../../../middleware/check-auth');
const checkCustomer = require('../../../../middleware/check-customer');
const verifyDelete = require('../../../../middleware/verifyDelete');
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');

const controllers = require('../../controllers');
const controller = controllers.productSupplierController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products

const baseRouteForObject = `/suppliers`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}/:id`, checkIDs(validate.id), controller.getProductSupplier);

router.get(`${baseRouteForObject}/`, controller.getProductSuppliers);

router.post(`${baseRouteForObject}/`,  controller.postProductSupplier);

router.patch(`${baseRouteForObject}/:id`, checkIDs(validate.id), verifyDelete, controller.patchProductSupplier);

router.delete(`${baseRouteForObject}/:id`, checkIDs(validate.id), controller.deleteProductSupplier);

module.exports = router;