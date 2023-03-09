const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');

const controllers = require('../controllers');
const controller = controllers.machineCategoryController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products

const baseRouteForObject = `/categories`; 

router.use(checkAuth);

router.get(`${baseRouteForObject}/:id`, controller.getMachineCategory);

router.get(`${baseRouteForObject}/`, controller.getMachineCategories);

router.post(`${baseRouteForObject}/`,  controller.postMachineCategory);

router.patch(`${baseRouteForObject}/:id`,  controller.patchMachineCategory);

router.delete(`${baseRouteForObject}/:id`, controller.deleteMachineCategory);

module.exports = router;