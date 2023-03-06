//'use strict'

const apiPath = process.env.API_ROOT;
const customerRoute = require('./customerRoute');
const customerSiteRoute = require('./customerSiteRoute');
const customerContactRoute = require('./customerContactRoute');
const customerNoteRoute = require('./customerNoteRoute');


exports.registerCustomerRoutes = (app, apiPath) => {
    const rootPath = `${apiPath}/customers`
    app.use(`${rootPath}/customers`, customerRoute);
    app.use(`${rootPath}`, customerSiteRoute);
    app.use(`${rootPath}`, customerContactRoute);
    app.use(`${rootPath}`, customerNoteRoute);
}