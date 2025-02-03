const configRoute = require('./configRoute');

exports.registerConfigRoutes = (app, apiPath) => {
    const rootPathForModule = `${apiPath}/cp/config`
    app.use(`${rootPathForModule}`, configRoute);
} 