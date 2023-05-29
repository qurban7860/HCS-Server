//'use strict'

const apiPath = process.env.API_ROOT;
const emailRoute = require('./emailRoute');

exports.registerEmailRoutes = (app, apiPath) => {
    const rootPathForModule = `${apiPath}/emails`

    // localhost://api/1.0.0/emails/
    app.use(`${rootPathForModule}`, emailRoute);

}