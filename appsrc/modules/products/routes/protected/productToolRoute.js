const express = require('express');

const checkAuth = require('../../../../middleware/check-auth');
const checkCustomer = require('../../../../middleware/check-customer');
const verifyDelete = require('../../../../middleware/verifyDelete');
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');

const controllers = require('../../controllers');
const controller = controllers.productToolController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products

const baseRouteForObject = `/tools`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}/:id`, checkIDs(validate.id), controller.getProductTool);

router.get(`${baseRouteForObject}/`, controller.getProductTools);

router.post(`${baseRouteForObject}/`,  controller.postProductTool);

router.patch(`${baseRouteForObject}/:id`, checkIDs(validate.id), verifyDelete, controller.patchProductTool);

router.delete(`${baseRouteForObject}/:id`, checkIDs(validate.id), controller.deleteProductTool);

module.exports = router;