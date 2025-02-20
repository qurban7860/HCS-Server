const express = require('express');

const checkAuth = require('../../../../middleware/check-auth');
const checkCustomer = require('../../../../middleware/check-customer');
const verifyDelete = require('../../../../middleware/verifyDelete');
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');

const controllers = require('../../controllers');
const controller = controllers.categoryGroupController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products

const baseRouteForObject = `/groups`; 

router.use(checkAuth, checkCustomer);

router.get(`${baseRouteForObject}/:id`, checkIDs(validate.id), controller.getCategoryGroup);

router.get(`${baseRouteForObject}/`, controller.getCategoryGroups);

router.post(`${baseRouteForObject}/`, controller.postCategoryGroup);

router.patch(`${baseRouteForObject}/:id`, checkIDs(validate.id), verifyDelete, controller.patchCategoryGroup);

router.delete(`${baseRouteForObject}/:id`, checkIDs(validate.id), controller.deleteCategoryGroup);

module.exports = router;