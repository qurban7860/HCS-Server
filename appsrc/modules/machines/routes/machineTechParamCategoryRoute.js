const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');

const controllers = require('../controllers');
const controller = controllers.machineTechParamCategoryController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products

const baseRouteForObject = `/techparamcategories`; 

router.use(checkAuth);

router.get(`${baseRouteForObject}/:id`, controller.getMachineTechParamCategory);

router.get(`${baseRouteForObject}/`, controller.getMachineTechParamCategories);

router.post(`${baseRouteForObject}/`,  controller.postMachineTechParamCategory);

router.patch(`${baseRouteForObject}/:id`,  controller.patchMachineTechParamCategory);

router.delete(`${baseRouteForObject}/:id`, controller.deleteMachineTechParamCategory);

module.exports = router;