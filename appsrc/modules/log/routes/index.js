//'use strict'

const apiPath = process.env.API_ROOT;
const erpLogRoute = require('./erpLogRoute');

exports.registerlogRoutes = (app, apiPath) => {
    const rootPathForModule = `${apiPath}/logs`

    app.use(`${rootPathForModule}`, erpLogRoute);

}