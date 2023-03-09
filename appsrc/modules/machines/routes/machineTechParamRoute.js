const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');

const controllers = require('../controllers');
const controller = controllers.machineTechParamController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/products

const baseRouteForObject = `/techparams`; 

router.use(checkAuth);

router.get(`${baseRouteForObject}/:id`, controller.getMachineTechParam);

router.get(`${baseRouteForObject}/`, controller.getMachineTechParams);

router.post(`${baseRouteForObject}/`,  controller.postMachineTechParam);

router.patch(`${baseRouteForObject}/:id`,  controller.patchMachineTechParam);

router.delete(`${baseRouteForObject}/:id`, controller.deleteMachineTechParam);

module.exports = router;