const documentCategoryRoute = require('./documentCategoryRoute');
const documentFileRoute = require('./documentFileRoute');
const documentRoute = require('./documentRoute');
const documentTypeRoute = require('./documentTypeRoute');
const documentVersionRoute = require('./documentVersionRoute');

exports.registerDocumentRoutes = (app, apiPath) => {
    const rootPathForModule = `${apiPath}/cp/documents`

    app.use(`${rootPathForModule}`, documentCategoryRoute);
    app.use(`${rootPathForModule}`, documentFileRoute);
    app.use(`${rootPathForModule}`, documentRoute);
    app.use(`${rootPathForModule}`, documentTypeRoute);
    app.use(`${rootPathForModule}`, documentVersionRoute);
} 