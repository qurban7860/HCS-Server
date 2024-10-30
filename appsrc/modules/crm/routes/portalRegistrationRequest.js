const express = require('express');
const { validatePortalReq } = require('../bodyValidation/portalRegistration');
const controllers = require('../controllers');
const controller = controllers.portalRegistration;
const router = express.Router();

// - /api/1.0.0/crm/
const baseRouteForObject = "/customers/register"; 

// - /api/1.0.0/crm/customers/register/
router.post(`${baseRouteForObject}/`, validatePortalReq('new'), controller.postRegisterRequest);

// Exported function to register customer routes
const registerCustomerRequestRoute = (app, apiPath) => {
    const rootPathForModule = `${apiPath}/crm`;

    // Use the router with the defined root path
    app.use(rootPathForModule, router);
};

module.exports = { registerCustomerRequestRoute };