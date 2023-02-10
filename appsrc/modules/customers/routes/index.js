//'use strict'

const apiPath = process.env.API_ROOT;
const customerRoute = require('./customerRoute');
const customerSiteRoute = require('./customerSiteRoute');
const customerContactRoute = require('./customerContactRoute');
const customerNoteRoute = require('./customerNoteRoute');


exports.registerCustomerRoutes = (app, apiPath) => {
    const rootPath = `${apiPath}/customers`
    app.use(`${rootPath}`, customerRoute);
    app.use(`${rootPath}/sites`, customerSiteRoute);
    app.use(`${rootPath}/contacts`, customerContactRoute);
    app.use(`${rootPath}/notes`, customerNoteRoute);
}