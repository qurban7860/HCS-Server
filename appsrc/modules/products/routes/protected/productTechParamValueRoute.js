const express = require('express');

const checkAuth = require('../../../../middleware/check-auth');
const { Product } = require('../../models');
const checkProductID = require('../../../../middleware/check-parentID')('machine', Product);
const checkCustomer = require('../../../../middleware/check-customer');
const verifyDelete = require('../../../../middleware/verifyDelete');
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');

const controllers = require('../../controllers');
const controller = controllers.productTechParamValueController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products/machines

const baseRouteForObject = `/machines/:machineId/techparamvalues`;

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}/`, checkIDs(validate.id), checkProductID, controller.getProductTechParamValues);

router.get(`${baseRouteForObject}/softwareVersion/`, checkIDs(validate.id), checkProductID, controller.getSoftwareVersion);

router.get(`${baseRouteForObject}/:id`, checkIDs(validate.id), checkProductID, controller.getProductTechParamValue);

router.post(`${baseRouteForObject}/`, checkIDs(validate.id), checkProductID, controller.postProductTechParamValue);

router.patch(`${baseRouteForObject}/:id`, checkIDs(validate.id), checkProductID, verifyDelete, controller.patchProductTechParamValue);

router.delete(`${baseRouteForObject}/:id`, checkIDs(validate.id), checkProductID, verifyDelete, controller.deleteProductTechParamValue);

router.get('/techparamvalues/search', controller.searchProductTechParamValues);


module.exports = router;