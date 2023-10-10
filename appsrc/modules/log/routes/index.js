//'use strict'

const apiPath = process.env.API_ROOT;
const logRoute = require('./logRoute');

exports.registerlogRoutes = (app, apiPath) => {
    const rootPathForModule = `${apiPath}/logs`

    app.use(`${rootPathForModule}`, logRoute);

}