//'use strict'

const apiPath = process.env.API_ROOT;

exports.registerMachineRoutes = (app, apiPath) => {
    const rootPathForModule = `${ apiPath }/products`

    app.use(`${ rootPathForModule }`, require('./machineAuditLogRoute'));
    app.use(`${ rootPathForModule }`, require('./machineCategoryRoute'));
    app.use(`${ rootPathForModule }`, require('./machineLicenseRoute'));
    app.use(`${ rootPathForModule }`, require('./machineModelRoute'));
    app.use(`${ rootPathForModule }`, require('./machineNoteRoute'));
    app.use(`${ rootPathForModule }`, require('./machineRoute'));
    app.use(`${ rootPathForModule }`, require('./machineStatusRoute'));
    app.use(`${ rootPathForModule }`, require('./machineSupplierRoute'));
    app.use(`${ rootPathForModule }`, require('./machineTechParamCategoryRoute'));
    app.use(`${ rootPathForModule }`, require('./machineTechParamRoute'));
    app.use(`${ rootPathForModule }`, require('./machineTechParamValueRoute'));
    app.use(`${ rootPathForModule }`, require('./machineToolInstalledRoute'));
    app.use(`${ rootPathForModule }`, require('./machineToolRoute'));
}

