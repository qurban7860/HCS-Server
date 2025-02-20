const express = require('express');

const checkAuth = require('../../../../middleware/check-auth');
const checkCustomer = require('../../../../middleware/check-customer');
const verifyDelete = require('../../../../middleware/verifyDelete');
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');

const controllers = require('../../controllers');
const controller = controllers.productTechParamController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products

const baseRouteForObject = `/techparams`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}/:id`, checkIDs(validate.id), controller.getProductTechParam);

router.get(`${baseRouteForObject}/`, controller.getProductTechParams);

router.post(`${baseRouteForObject}/`,  controller.postProductTechParam);

router.patch(`${baseRouteForObject}/:id`, checkIDs(validate.id), verifyDelete, controller.patchProductTechParam);

router.delete(`${baseRouteForObject}/:id`, checkIDs(validate.id), controller.deleteProductTechParam);

module.exports = router;