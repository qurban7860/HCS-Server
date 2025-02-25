const express = require('express');

const checkAuth = require('../../../../middleware/check-auth');
const roleCheck = require('../../../../middleware/role-check');
const verifyDelete = require('../../../../middleware/verifyDelete');
const { portalSchema } = require('../../schema/crmSchemas');
const { validateRequest } = require('../../../../configs/reqServices');
const checkIDs = require('../../../../middleware/validateParamIDs');
const validate = require('../../utils/validate');

const controllers = require('../../controllers');
const controller = controllers.portalRegistration;

const router = express.Router();

// - /api/1.0.0/crm/
const baseRouteForObject = "/customers/register";

// - /api/1.0.0/crm/customers/register/
router.get(`${baseRouteForObject}`, checkAuth, controller.getRegisteredRequests);

// - /api/1.0.0/crm/customers/register/:id
router.get(`${baseRouteForObject}/:id`, checkIDs(validate.id), checkAuth, controller.getRegisteredRequest);

// - /api/1.0.0/crm/customers/register/:id
router.patch(`${baseRouteForObject}/:id`, checkIDs(validate.id), checkAuth, validateRequest(portalSchema('update')), verifyDelete, roleCheck, controller.patchRegisteredRequest);

// - /api/1.0.0/crm/customers/register/:id
router.delete(`${baseRouteForObject}/:id`, checkIDs(validate.id), checkAuth, controller.deleteRegisteredRequest);


module.exports = router;