//'use strict'

const apiPath = process.env.API_ROOT;
const projectRoute = require('./project');

exports.registerProjectRoutes = (app, apiPath) => {
    // localhost://api/1.0.0/support/
    app.use(`${apiPath}/support/`, projectRoute);
}