const express = require('express');
const { portalSchema } = require('../../schema/crmSchemas');
const { validateRequest } = require('../../../../configs/reqServices');
const controllers = require('../../controllers');
const controller = controllers.portalRegistration;
const router = express.Router();

// - /api/1.0.0/
const baseRouteForObject = "/customers/register"; 

// - /api/1.0.0/customer/register/
router.post(`${baseRouteForObject}/`, validateRequest( portalSchema('new') ), controller.postRegisterRequest);

module.exports = router;
