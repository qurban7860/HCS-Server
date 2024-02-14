//'use strict'

const apiPath = process.env.API_ROOT;
const backupRoute = require('./backupRoute');

exports.registerBackupRoutes = (app, apiPath) => {
    const rootPathForModule = `${apiPath}/dbbackups`
    app.use(`${rootPathForModule}`, backupRoute);
}