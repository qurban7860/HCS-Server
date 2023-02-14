//'use strict'

const apiPath = process.env.API_ROOT;

exports.registerMachineRoutes = (app, apiPath) => {
    const rootPath = `${ apiPath }/machines`

    app.use(`${ rootPath }/auditlogs`, require('./machineAuditLogRoute'));
    app.use(`${ rootPath }/categories`, require('./machineCategoryRoute'));
    app.use(`${ rootPath }/licenses`, require('./machineLicenseRoute'));
    app.use(`${ rootPath }/models`, require('./machineModelRoute'));
    app.use(`${ rootPath }/notes`, require('./machineNoteRoute'));
    app.use(`${ rootPath }/machines`, require('./machineRoute'));
    app.use(`${ rootPath }/statuses`, require('./machineStatusRoute'));
    app.use(`${ rootPath }/suppliers`, require('./machineSupplierRoute'));
    app.use(`${ rootPath }/techparamcategories`, require('./machineTechParamCategoryRoute'));
    app.use(`${ rootPath }/techparams`, require('./machineTechParamRoute'));
    app.use(`${ rootPath }/techparamvalues`, require('./machineTechParamValueRoute'));
    app.use(`${ rootPath }/toolsinstalled`, require('./machineToolInstalledRoute'));
    pp.use(`${ rootPath }/tools`, require('./machineToolRoute'));
}

