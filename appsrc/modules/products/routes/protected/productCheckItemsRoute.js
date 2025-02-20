const express = require('express');

const checkAuth = require('../../../../middleware/check-auth');
const checkCustomer = require('../../../../middleware/check-customer');
const verifyDelete = require('../../../../middleware/verifyDelete');
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');

const controllers = require('../../controllers');
const controller = controllers.productCheckItemsController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products

const baseRouteForObject = `/checkItems`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}/:id`, checkIDs(validate.id), controller.getProductCheckItem);

router.get(`${baseRouteForObject}/`, controller.getProductCheckItems);

router.post(`${baseRouteForObject}/`,  controller.postProductCheckItems);

router.patch(`${baseRouteForObject}/:id`, checkIDs(validate.id), verifyDelete, controller.patchProductCheckItems);

router.delete(`${baseRouteForObject}/:id`, checkIDs(validate.id), controller.deleteProductCheckItems);

module.exports = router;