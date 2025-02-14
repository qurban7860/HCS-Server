const express = require('express');
const validateCustomerInQuery = require('../../../../middleware/validateCustomerInQuery');
const validateCustomerInRequest = require('../../../../middleware/validateCustomerInRequest');
const controllers = require('../../../crm/controllers');
const controller = controllers.portalRegistration;
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');
const router = express.Router();

// - /api/1.0.0/cp/crm/public/customers/register
router.post(`/customers/register`, validateCustomerInRequest, controller.postRegisterRequest);
// router.get(`/customers/register`, validateCustomerInQuery, controller.getRegisteredRequests);
// router.get(`/customers/register/:id`, checkIDs(validate.id), validateCustomerInQuery, controller.getRegisteredRequest);
// router.patch(`/customers/register/:id`, checkIDs(validate.id), validateCustomerInRequest, controller.patchRegisteredRequest);

module.exports = router; 