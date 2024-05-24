//'use strict'

const apiPath = process.env.API_ROOT;
const eventRoute = require('./eventRoute');


exports.registerEventRoutes = (app, apiPath) => {
    const rootPathForModule = `${apiPath}/calender`

    app.use(`${rootPathForModule}`, eventRoute);
}