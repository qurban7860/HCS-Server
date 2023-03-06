const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomerID = require('../../../middleware/check-parentID')('customer');

const controllers = require('../controllers');
const controller = controllers.customerSiteController;

const router = express.Router();

const baseRoute = `/:customerId/sites`; 

router.get(`${baseRoute}/:id`, checkCustomerID, controller.getCustomerSite);

router.get(`${baseRoute}`, checkCustomerID, controller.getCustomerSites);

router.post(`${baseRoute}`, checkCustomerID,  controller.postCustomerSite);

router.patch(`${baseRoute}/:id`, checkCustomerID,  controller.patchCustomerSite);

router.delete(`${baseRoute}/:id`, checkCustomerID, controller.deleteCustomerSite);

router.get(`/sites/`, controller.searchCustomerSites);

module.exports = router;