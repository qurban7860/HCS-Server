//'use strict'

const apiPath = process.env.API_ROOT;
const customerRoute = require('./customerRoute');
const customerSiteRoute = require('./customerSiteRoute');
const customerContactRoute = require('./customerContactRoute');
const customerNoteRoute = require('./customerNoteRoute');
const customerSearchRoute = require('./customerSearchRoute');

exports.registerCustomerRoutes = (app, apiPath) => {
    const rootPathForModule = `${apiPath}/crm`

    // localhost://api/1.0.0/crm/
    app.use(`${rootPathForModule}`, customerRoute);
    
    // localhost://api/1.0.0/crm/customers
    app.use(`${rootPathForModule}/customers`, customerSiteRoute);
    
    // localhost://api/1.0.0/crm/customers
    app.use(`${rootPathForModule}/customers`, customerContactRoute);

    // localhost://api/1.0.0/crm/customers
    app.use(`${rootPathForModule}/customers`, customerNoteRoute);

    // localhost://api/1.0.0/crm/search
    app.use(`${rootPathForModule}/search`, customerSearchRoute);
}