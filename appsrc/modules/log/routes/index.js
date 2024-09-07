//'use strict'

const apiPath = process.env.API_ROOT;
const erpLogRoute = require('./erpLogRoute');
const coilLogRoute = require('./coilLogRoute');
const logRoute = require('./logRoute');
const productionLogRoute = require('./productionLogRoute');
const toolCountLogRoute = require('./toolCountLogRoute');
const wasteLogRoute = require('./wasteLogRoute');
const logFormatRoute = require('./logFormatRoute');
const pm2LogRoute = require('./pm2LogRoute');

exports.registerlogRoutes = (app, apiPath) => {
    const rootPathForModule = `${apiPath}/logs`

    app.use(`${rootPathForModule}`, erpLogRoute);
    app.use(`${rootPathForModule}`, coilLogRoute);
    app.use(`${rootPathForModule}`, logRoute);
    app.use(`${rootPathForModule}`, productionLogRoute);
    app.use(`${rootPathForModule}`, toolCountLogRoute);
    app.use(`${rootPathForModule}`, wasteLogRoute);
    app.use(`${rootPathForModule}`, logFormatRoute);
    app.use(`${rootPathForModule}`, pm2LogRoute);
    


}