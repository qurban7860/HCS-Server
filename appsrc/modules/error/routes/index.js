
const errorRoute = require('./errorRoute');

exports.registerErrorRoutes = (app, apiPath) => {
    const rootPathForModule = `${apiPath}/error`
    // api/1.0.0/error/
    app.use(`${rootPathForModule}`, errorRoute);

}