const express = require('express');
const { check } = require('express-validator');

const fileUpload = require('../../../middleware/file-upload');
const checkAuth = require('../../../middleware/check-auth');
const { Customer } = require('../models');
const verifyDelete = require('../../../middleware/verifyDelete');

const controllers = require('../controllers');
const controller = controllers.organizationController;

const router = express.Router();

//  - route information from parent
// - /api/1.0.0/crm

// - /api/1.0.0/crm/organization 
const baseRouteForObject = `/organization`; 

// EndPoint: {{baseUrl}}/crm/organization/:id
// localhost://api/1.0.0/crm/organization 

router.use(checkAuth);

// - /api/1.0.0/crm/organization
router.get(`${baseRouteForObject}/search`, controller.searchOrganizations);

// - /api/1.0.0/crm/organization/:id
router.get(`${baseRouteForObject}/:id`, controller.getOrganization);

// - /api/1.0.0/crm/organization/
router.get(`${baseRouteForObject}/`, controller.getOrganizations);

// - /api/1.0.0/crm/organization/
router.post(`${baseRouteForObject}/`, controller.postOrganization);

// - /api/1.0.0/crm/organization/:id
router.patch(`${baseRouteForObject}/:id`, verifyDelete, controller.patchOrganization);

// - /api/1.0.0/crm/organization/:id
router.delete(`${baseRouteForObject}/:id`, controller.deleteOrganization);

module.exports = router;