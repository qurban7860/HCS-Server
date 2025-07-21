
const httpCodeRoute = require('./httpCodeRoute');

exports.registerHttpCodeRoutes = (app, apiPath) => {
    const rootPathForModule = `${apiPath}/httpCode`
    // api/1.0.0/error/
    app.use(`${rootPathForModule}`, httpCodeRoute);

}