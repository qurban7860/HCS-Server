//'use strict'

const apiPath = process.env.API_ROOT;
const documentTypeRoute = require('./documentTypeRoute');
const documentRoute = require('./documentRoute');
const documentCategoryRoute = require('./documentCategoryRoute');

exports.registerFileRoutes = (app, apiPath) => {
    const rootPathForModule = `${apiPath}/filemanager`

    // localhost://api/1.0.0/files/
    app.use(`${rootPathForModule}`, documentTypeRoute);

    // localhost://api/1.0.0/files/
    app.use(`${rootPathForModule}`, documentRoute);

   // localhost://api/1.0.0/files/
   app.use(`${rootPathForModule}`, documentCategoryRoute);
}