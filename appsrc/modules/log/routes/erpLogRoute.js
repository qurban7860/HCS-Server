const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../../../middleware/check-auth');
const checkCustomer = require('../../../middleware/check-customer');

const controllers = require('../controllers');
const controller = controllers.erpLogController;

const router = express.Router();

router.use(checkAuth, checkCustomer);


router.get(`/erp/`, controller.getLogs);

router.get(`/erp/:id`, controller.getLog);


router.post(`/erp/`, controller.postLog);

router.patch(`/erp/:id`, controller.patchLog);

module.exports = router;