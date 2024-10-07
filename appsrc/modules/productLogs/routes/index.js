//'use strict'

const logRoute = require('./logRoute');

exports.registerProductLogsRoutes = (app, apiPath) => {
    const rootPathForModule = `${apiPath}/productLogs`
    app.use(`${rootPathForModule}`, logRoute);
}