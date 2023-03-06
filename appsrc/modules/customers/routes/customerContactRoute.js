const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomerID = require('../../../middleware/check-parentID')('customer');


const controllers = require('../controllers');
const controller = controllers.customerContactController;

const router = express.Router();

const baseRoute = `/:customerId/contacts`;
// router.use(checkAuth);

router.get(`${baseRoute}/:id`, checkCustomerID,controller.getCustomerContact);

router.get(`${baseRoute}`, checkCustomerID, controller.getCustomerContacts);

router.post(`${baseRoute}`, checkCustomerID,controller.postCustomerContact);

router.patch(`${baseRoute}/:id`, checkCustomerID, controller.patchCustomerContact);

router.delete(`${baseRoute}/:id`, checkCustomerID, controller.deleteCustomerContact);

router.get(`/contacts/`, controller.searchCustomerContacts);


module.exports = router;