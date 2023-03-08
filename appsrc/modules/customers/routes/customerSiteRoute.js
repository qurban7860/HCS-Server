const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const { Customer } = require('../models');
const checkCustomerID = require('../../../middleware/check-parentID')('customer', Customer);

const controllers = require('../controllers');
const controller = controllers.customerSiteController;

const router = express.Router();

const baseRoute = `/:customerId/sites`; 

router.use(checkAuth);

router.get(`${baseRoute}/:id`, checkCustomerID, controller.getCustomerSite);

router.get(`${baseRoute}`, checkCustomerID, controller.getCustomerSites);

router.post(`${baseRoute}`, checkCustomerID,  controller.postCustomerSite);

router.patch(`${baseRoute}/:id`, checkCustomerID,  controller.patchCustomerSite);

router.delete(`${baseRoute}/:id`, checkCustomerID, controller.deleteCustomerSite);

router.get(`/sites/`, controller.searchCustomerSites);

module.exports = router;