//'use strict'

const apiPath = process.env.API_ROOT;
const regionRoute = require('./regionRoute');
const countryRoute = require('./countryRoute');


exports.registerRegionRoutes = (app, apiPath) => {
    const rootPathForModule = `${apiPath}/regions`

    // localhost://api/1.0.0/emails/
    app.use(`${rootPathForModule}`, regionRoute);
    app.use(`${rootPathForModule}`, countryRoute);
}