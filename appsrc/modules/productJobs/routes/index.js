//'use strict'

const apiPath = process.env.API_ROOT;
const componentRoute = require('./componentRoute');
const jobExecutionRoute = require('./jobExecutionRoute');
const jobExecutionStatusRoute = require('./jobExecutionStatusRoute');
const jobRoute = require('./jobRoute');

exports.registerJobRoutes = (app, apiPath) => {
    const rootPathForModule = `${apiPath}/jobs`
    app.use(`${rootPathForModule}`, componentRoute);
    app.use(`${rootPathForModule}`, jobExecutionRoute);
    app.use(`${rootPathForModule}`, jobExecutionStatusRoute);
    app.use(`${rootPathForModule}`, jobRoute);
}