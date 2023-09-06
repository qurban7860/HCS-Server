//'use strict'

const apiPath = process.env.API_ROOT;

exports.registerProductRoutes = (app, apiPath) => {
    const rootPathForModule = `${ apiPath }/products`

    app.use(`${ rootPathForModule }`, require('./productAuditLogRoute'));
    app.use(`${ rootPathForModule }`, require('./productCategoryRoute'));
    app.use(`${ rootPathForModule }`, require('./productConnectionRoute'));
    app.use(`${ rootPathForModule }`, require('./productDrawingRoute'));
    app.use(`${ rootPathForModule }`, require('./productLicenseRoute'));
    app.use(`${ rootPathForModule }`, require('./productModelRoute'));
    app.use(`${ rootPathForModule }`, require('./productNoteRoute'));
    app.use(`${ rootPathForModule }`, require('./productRoute'));
    app.use(`${ rootPathForModule }`, require('./productStatusRoute'));
    app.use(`${ rootPathForModule }`, require('./productSupplierRoute'));
    app.use(`${ rootPathForModule }`, require('./productTechParamCategoryRoute'));
    app.use(`${ rootPathForModule }`, require('./productTechParamRoute'));
    app.use(`${ rootPathForModule }`, require('./productTechParamValueRoute'));
    app.use(`${ rootPathForModule }`, require('./productToolInstalledRoute'));
    app.use(`${ rootPathForModule }`, require('./productToolRoute'));
    app.use(`${ rootPathForModule }`, require('./productServiceParamsRoute'));
    app.use(`${ rootPathForModule }`, require('./productServiceRecordsConfigRoute'));
    app.use(`${ rootPathForModule }`, require('./productServiceRecordsRoute'));
    app.use(`${ rootPathForModule }`, require('./productServiceCategoryRoute'));
}

