const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomerID = require('../../../middleware/check-parentID')('customer');


const controllers = require('../controllers');
const controller = controllers.customerNoteController;

const router = express.Router();

const baseRoute = `/:customerId/notes`;

router.use(checkAuth);

router.get(`${baseRoute}/:id`, checkCustomerID, controller.getCustomerNote);

router.get(`${baseRoute}`, checkCustomerID, controller.getCustomerNotes);

router.post(`${baseRoute}`, checkCustomerID, controller.postCustomerNote);

router.patch(`${baseRoute}/:id`, checkCustomerID, controller.patchCustomerNote);

router.delete(`${baseRoute}/:id`, checkCustomerID, controller.deleteCustomerNote);

router.get(`/notes/`, controller.searchCustomerNotes);

module.exports = router;