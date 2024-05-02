//'use strict'

const apiPath = process.env.API_ROOT;
const erpLogRoute = require('./erpLogRoute');
const logFormatRoute = require('./logFormatRoute');
const pm2LogRoute = require('./pm2LogRoute');

exports.registerlogRoutes = (app, apiPath) => {
    const rootPathForModule = `${apiPath}/logs`

    app.use(`${rootPathForModule}`, erpLogRoute);
    app.use(`${rootPathForModule}`, logFormatRoute);
    app.use(`${rootPathForModule}`, pm2LogRoute);
    


}