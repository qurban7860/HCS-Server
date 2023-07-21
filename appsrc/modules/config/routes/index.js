//'use strict'

const apiPath = process.env.API_ROOT;
const configRoute = require('./configRoute');

exports.registerRegionRoutes = (app, apiPath) => {
    const rootPathForModule = `${apiPath}/configs`

    // localhost://api/1.0.0/emails/
    app.use(`${rootPathForModule}`, configRoute);

}