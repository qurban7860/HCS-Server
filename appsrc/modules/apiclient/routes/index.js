//'use strict'

const apiPath = process.env.API_ROOT;
const apilogRoute = require('./apilogRoute');


exports.registerapiClientRoutes = (app, apiPath) => {
    const rootPathForModule = `${apiPath}/apiclient`

    app.use(`${rootPathForModule}`, apilogRoute);
    app.use(`${ rootPathForModule }`, require('./productConfigurationRoute'));
}