//'use strict'

const apiPath = process.env.API_ROOT;
const logRoute = require('./logRoute');
const logFormatRoute = require('./logFormatRoute');
const pm2LogRoute = require('./pm2LogRoute');

exports.registerlogRoutes = (app, apiPath) => {
    const rootPathForModule = `${apiPath}/logs`
    app.use(`${rootPathForModule}`, logRoute);
    app.use(`${rootPathForModule}`, logFormatRoute);
    app.use(`${rootPathForModule}`, pm2LogRoute);
    


}