const express = require('express');
const controllers = require('../../../crm/controllers');
const controller = controllers.portalRegistration;

const router = express.Router();

// - /api/1.0.0/cp/crm/public/customers/register
router.post(`/customers/register`, controller.postRegisterRequest);

module.exports = router; 