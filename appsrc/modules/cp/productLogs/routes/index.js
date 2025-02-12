const productLogsRoute = require('./productLogsRoute');

exports.registerProductLogsRoutes = (app, apiPath) => {
    const rootPathForModule = `${apiPath}/cp/productLogs`
    app.use(`${rootPathForModule}`, productLogsRoute);
} 