const express = require('express');

const checkAuth = require('../../../middleware/check-auth');
const roleCheck = require('../../../middleware/role-check');
const verifyDelete = require('../../../middleware/verifyDelete');
const { validatePortalReq } = require('../bodyValidation/portalRegistration');

const controllers = require('../controllers');
const controller = controllers.portalRegistration;

const router = express.Router();

// - /api/1.0.0/crm/
const baseRouteForObject = "/customers/register"; 

// - /api/1.0.0/crm/customers/register/
router.get(`${baseRouteForObject}`, checkAuth, controller.getRegisteredRequests);

// - /api/1.0.0/crm/customers/register/:id
router.get(`${baseRouteForObject}/:id`, checkAuth, controller.getRegisteredRequest);

// - /api/1.0.0/crm/customers/register/
router.post(`${baseRouteForObject}/`, checkAuth, validatePortalReq('new'), controller.postRegisterRequest);

// - /api/1.0.0/crm/customers/register/:id
router.patch(`${baseRouteForObject}/:id`, checkAuth, validatePortalReq('update'), verifyDelete, roleCheck, controller.patchRegisteredRequest);

// - /api/1.0.0/crm/customers/register/:id
router.delete(`${baseRouteForObject}/:id`, checkAuth, controller.deleteRegisteredRequest);


module.exports = router;