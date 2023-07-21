//'use strict'

const apiPath = process.env.API_ROOT;
const regionRoute = require('./regionRoute');

exports.registerRegionRoutes = (app, apiPath) => {
    const rootPathForModule = `${apiPath}/regions`

    // localhost://api/1.0.0/emails/
    app.use(`${rootPathForModule}`, regionRoute);

}