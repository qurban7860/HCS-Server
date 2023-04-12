//'use strict'

const apiPath = process.env.API_ROOT;

exports.registerDashboardRoutes = (app, apiPath) => {
    const rootPathForModule = `${ apiPath }/dashboard`

    app.use(`${ rootPathForModule }`, require('./dashboardRoute'));
}

