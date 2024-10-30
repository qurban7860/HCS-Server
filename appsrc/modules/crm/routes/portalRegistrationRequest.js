const express = require('express');
const { validatePortalReq } = require('../bodyValidation/portalRegistration');
const controllers = require('../controllers');
const controller = controllers.portalRegistration;
const router = express.Router();

// - /api/1.0.0/
const baseRouteForObject = "/customer/register"; 

// - /api/1.0.0/customer/register/
router.post(`${baseRouteForObject}/`, validatePortalReq('new'), controller.postRegisterRequest);

// Exported function to register customer routes
const registerCustomerRequestRoute = (app, apiPath) => {
    const rootPathForModule = `${apiPath}`;

    // Use the router with the defined root path
    app.use(rootPathForModule, router);
};

module.exports = { registerCustomerRequestRoute };