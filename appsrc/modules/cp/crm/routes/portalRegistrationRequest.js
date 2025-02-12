const express = require('express');
const validateCustomerInQuery = require('../../../../middleware/validateCustomerInQuery');
const controllers = require('../../../crm/controllers');
const controller = controllers.portalRegistration;
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');
const router = express.Router();

// - /api/1.0.0/cp/crm/public/customers/register
router.post(`/customers/register`, controller.postRegisterRequest);
router.get(`/customers/register`, validateCustomerInQuery, controller.getRegisteredRequests);
router.get(`/customers/register/:id`, checkIDs(validate.id), validateCustomerInQuery, controller.getRegisteredRequest);

module.exports = router; 