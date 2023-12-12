//'use strict'

const apiPath = process.env.API_ROOT;
const configRoute = require('./configRoute');
const metaSchema = require('./metaSchema');

exports.registerConfigRoutes = (app, apiPath) => {
    const rootPathForModule = `${apiPath}/configs`

    // localhost://api/1.0.0/configs/

    app.use(`${rootPathForModule}`, metaSchema);
    app.use(`${rootPathForModule}`, configRoute);

}