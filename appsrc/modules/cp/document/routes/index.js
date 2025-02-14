const documentCategoryRoute = require('./documentCategoryRoute');
const documentFileRoute = require('./documentFileRoute');
const documentTypeRoute = require('./documentTypeRoute');
const drawingRoute = require('./drawingRoute');

exports.registerDocumentRoutes = (app, apiPath) => {
    const rootPathForModule = `${apiPath}/cp/documents`

    app.use(`${rootPathForModule}`, documentCategoryRoute);
    app.use(`${rootPathForModule}`, documentFileRoute);
    app.use(`${rootPathForModule}`, documentTypeRoute);
    app.use(`${apiPath}/cp/products`, drawingRoute);
} 