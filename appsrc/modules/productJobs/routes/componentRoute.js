const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');

const controllers = require('../controllers');
const controller = controllers.componentController;

const router = express.Router();

router.use(checkAuth, checkCustomer);

const basicRoute = 'components';

router.get(`/${basicRoute}/`, controller.getComponents);

router.get(`/${basicRoute}/:id`, controller.getComponent);

router.post(`/${basicRoute}/`, controller.postComponent);

router.patch(`/${basicRoute}/:id`, controller.patchComponent);

router.delete(`/${basicRoute}/:id`, controller.deleteComponent);

module.exports = router;