const express = require('express');
const { validatePortalReq } = require('../bodyValidation/portalRegistration');

const controllers = require('../controllers');
const controller = controllers.portalRegistration;

const router = express.Router();

// - /api/1.0.0/crm/
const baseRouteForObject = "/customers/register"; 

// - /api/1.0.0/crm/customers/register/
router.post(`${baseRouteForObject}/`, validatePortalReq('new'), controller.postRegisterRequest);

module.exports = router;