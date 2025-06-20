//'use strict'

const apiPath = process.env.API_ROOT;
const releaseRoute = require('./release');

exports.registerReleaseRoutes = (app, apiPath) => {
    // localhost://api/1.0.0/support/
    app.use(`${apiPath}/support/`, releaseRoute);
}