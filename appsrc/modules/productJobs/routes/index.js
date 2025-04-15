//'use strict'

const componentRoute = require('./protected/componentRoute');
const jobExecutionRoute = require('./protected/jobExecutionRoute');
const jobExecutionStatusRoute = require('./protected/jobExecutionStatusRoute');
const jobRoute = require('./protected/jobRoute');

const publicComponentRoute = require('./public/componentRoute');
const publicJobRoute = require('./public/jobRoute');
// Public Routes (no auth required)

exports.registerPublicJobRoutes = (app, apiPath) => {
    const rootPathForModule = `${apiPath}/public/jobs`
    app.use(`${rootPathForModule}`, publicComponentRoute);
    app.use(`${rootPathForModule}`, publicJobRoute);
}


exports.registerJobRoutes = (app, apiPath) => {
    const rootPathForModule = `${apiPath}/jobs`
    app.use(`${rootPathForModule}`, componentRoute);
    app.use(`${rootPathForModule}`, jobExecutionRoute);
    app.use(`${rootPathForModule}`, jobExecutionStatusRoute);
    app.use(`${rootPathForModule}`, jobRoute);
}
