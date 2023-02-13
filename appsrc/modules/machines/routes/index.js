//'use strict'

const apiPath = process.env.API_ROOT;
const machineCategoryRoute = require('./machineCategoryRoute');
const machineModelRoute = require('./machineModelRoute');

exports.registerMachineRoutes = (app, apiPath) => {
    const rootPath = `${ apiPath }/machines`
    app.use(`${ rootPath }/categories`, machineCategoryRoute);
    app.use(`${ rootPath }/models`, machineModelRoute);
}

