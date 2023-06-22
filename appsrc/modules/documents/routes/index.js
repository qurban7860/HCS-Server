//'use strict'

const apiPath = process.env.API_ROOT;
const documentTypeRoute = require('./documentTypeRoute');
const documentRoute = require('./documentRoute');
const documentCategoryRoute = require('./documentCategoryRoute');
const documentVersionRoute = require('./documentVersionRoute');
const documentFileRoute = require('./documentFileRoute');

exports.registerDocumentRoutes = (app, apiPath) => {
    const rootPathForModule = `${apiPath}/documents`

    // localhost://api/1.0.0/documents/
    app.use(`${rootPathForModule}`, documentTypeRoute);

    // localhost://api/1.0.0/documents/
    app.use(`${rootPathForModule}`, documentRoute);

   // localhost://api/1.0.0/documents/
   app.use(`${rootPathForModule}`, documentCategoryRoute);

   // localhost://api/1.0.0/documents/
   app.use(`${rootPathForModule}`, documentVersionRoute);

   // localhost://api/1.0.0/documents/
   app.use(`${rootPathForModule}`, documentFileRoute);
}