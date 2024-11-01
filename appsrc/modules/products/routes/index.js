//'use strict'

const apiPath = process.env.API_ROOT;

exports.registerProductRoutes = (app, apiPath) => {
    const rootPathForModule = `${ apiPath }/products`
    
    // Machine Api which do not use Auth middleware 
    app.use(`${ rootPathForModule }`, require('./productMachineIntegrationRoute'));
    
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
    app.use(`${ rootPathForModule }`, require('./productCheckItemsRoute'));
    app.use(`${ rootPathForModule }`, require('./productServiceReportTemplateRoute'));
    app.use(`${ rootPathForModule }`, require('./productServiceReportRoute'));
    app.use(`${ rootPathForModule }`, require('./productServiceReportFileRoute'));
    app.use(`${ rootPathForModule }`, require('./productCheckItemCategoryRoute'));
    app.use(`${ rootPathForModule }`, require('./productProfileRoute'));
    app.use(`${ rootPathForModule }`, require('./productServiceReportValueRoute'));
    app.use(`${ rootPathForModule }`, require('./productServiceReportValueFileRoute'));
    app.use(`${ rootPathForModule }`, require('./categoryGroupRoute'));
    app.use(`${ rootPathForModule }`, require('./productIntegrationRoute'));
    
}

