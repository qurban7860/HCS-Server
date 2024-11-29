//'use strict'

const apiPath = process.env.API_ROOT;
const eventRoute = require('./eventRoute');
const eventFileRoute = require('./eventFileRoute');


exports.registerEventRoutes = (app, apiPath) => {
    const rootPathForModule = `${apiPath}/calender`

    app.use(`${rootPathForModule}`, eventRoute);
    app.use(`${rootPathForModule}`, eventFileRoute);
}