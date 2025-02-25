const configRoute = require('./configRoute');

exports.registerConfigRoutes = (app, apiPath) => {
    const rootPathForModule = `${apiPath}/cp/configs`
    app.use(`${rootPathForModule}`, configRoute);
} 