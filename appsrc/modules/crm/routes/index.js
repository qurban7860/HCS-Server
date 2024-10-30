//'use strict'

const apiPath = process.env.API_ROOT;
const customerRoute = require('./customerRoute');
const customerSiteRoute = require('./customerSiteRoute');
const customerContactRoute = require('./customerContactRoute');
const customerNoteRoute = require('./customerNoteRoute');
const departmentRoute = require('./departmentRoute');
const portalRegistration = require('./portalRegistration');
const portalRegistrationRequest = require('./portalRegistrationRequest');

exports.registerCustomerRoutes = (app, apiPath) => {
    
    const rootPathForModule = `${apiPath}/crm`

    // localhost://api/1.0.0/crm
    app.use(`${rootPathForModule}`, portalRegistrationRequest);

    
    app.use(`${rootPathForModule}`, portalRegistration);

    // localhost://api/1.0.0/crm/
    app.use(`${rootPathForModule}`, customerRoute);
    
    // localhost://api/1.0.0/crm
    app.use(`${rootPathForModule}`, customerSiteRoute);
    
    // localhost://api/1.0.0/crm
    app.use(`${rootPathForModule}`, customerContactRoute);

    // localhost://api/1.0.0/crm
    app.use(`${rootPathForModule}`, customerNoteRoute);

    // localhost://api/1.0.0/crm
    app.use(`${rootPathForModule}`, departmentRoute);

}