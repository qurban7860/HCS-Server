//'use strict'

const apiPath = process.env.API_ROOT;
const documentNameRoute = require('./documentNameRoute');
const fileRoute = require('./fileRoute');
const fileCategoryRoute = require('./fileCategoryRoute');

exports.registerFileRoutes = (app, apiPath) => {
    const rootPathForModule = `${apiPath}/filemanager`

    // localhost://api/1.0.0/files/
    app.use(`${rootPathForModule}`, documentNameRoute);

    // localhost://api/1.0.0/files/
    app.use(`${rootPathForModule}`, fileRoute);

   // localhost://api/1.0.0/files/
   app.use(`${rootPathForModule}`, fileCategoryRoute);
}