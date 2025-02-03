exports.registerDashboardRoutes = (app, apiPath) => {
    const rootPathForModule = `${apiPath}/cp/dashboard`
    app.use(`${rootPathForModule}`, require('./dashboardRoute'));
} 