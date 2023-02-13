const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');

const controllers = require('../controllers');
const controller = controllers.customerSiteController;

const router = express.Router();
// router.use(checkAuth);

router.get('/:id', controller.getCustomerSite);

router.get('/', controller.getCustomerSites);

router.post('/',  controller.postCustomerSite);

router.patch('/:id',  controller.patchCustomerSite);

//router.patch('/:id', fileUpload.single('image'), this.cntrl.patchModel);

router.delete('/:id', controller.deleteCustomerSite);

module.exports = router;