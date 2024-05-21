//'use strict'

const apiPath = process.env.API_ROOT;
const visitRoute = require('./visitRoute');


exports.registerVisitRoutes = (app, apiPath) => {
    const rootPathForModule = `${apiPath}/calender`

    app.use(`${rootPathForModule}`, visitRoute);
}