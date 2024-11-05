//'use strict'

// Public Routes (no auth required)
const publicRoutes = {
  machineIntegration: require("./nonAuth/productMachineIntegrationRoute"),
};

// Protected Routes (requiring auth)
const protectedRoutes = {
  auditLogs: require("./auth/productAuditLogRoute"),
  categories: require("./auth/productCategoryRoute"),
  connections: require("./auth/productConnectionRoute"),
  drawings: require("./auth/productDrawingRoute"),
  licenses: require("./auth/productLicenseRoute"),
  models: require("./auth/productModelRoute"),
  notes: require("./auth/productNoteRoute"),
  products: require("./auth/productRoute"),
  statuses: require("./auth/productStatusRoute"),
  suppliers: require("./auth/productSupplierRoute"),
  techParamCategories: require("./auth/productTechParamCategoryRoute"),
  techParams: require("./auth/productTechParamRoute"),
  techParamValues: require("./auth/productTechParamValueRoute"),
  toolsInstalled: require("./auth/productToolInstalledRoute"),
  tools: require("./auth/productToolRoute"),
  checkItems: require("./auth/productCheckItemsRoute"),
  serviceReportTemplates: require("./auth/productServiceReportTemplateRoute"),
  serviceReportNotes: require("./auth/productServiceReportNotesRoute"),
  serviceReportStatuses: require("./auth/productServiceReportStatusRoute"),
  serviceReports: require("./auth/productServiceReportRoute"),
  serviceReportFiles: require("./auth/productServiceReportFileRoute"),
  checkItemCategories: require("./auth/productCheckItemCategoryRoute"),
  profiles: require("./auth/productProfileRoute"),
  serviceReportValues: require("./auth/productServiceReportValueRoute"),
  serviceReportValueFiles: require("./auth/productServiceReportValueFileRoute"),
  categoryGroups: require("./auth/categoryGroupRoute"),
  integrations: require("./auth/productIntegrationRoute"),
};

exports.registerProductRoutes = (app, apiPath) => {
  const rootPathForModule = `${apiPath}/products`;

  // public/nonAuth routes mounted
  Object.entries(publicRoutes).forEach(([name, router]) => {
    app.use(`${rootPathForModule}/public`, router);
  });

  // Mount protected routes with auth middleware
  Object.entries(protectedRoutes).forEach(([name, router]) => {
    app.use(`${rootPathForModule}`, router);
  });

};




//   // Machine Api which do not use Auth middleware
//   app.use(`${rootPathForModule}`, require("./productMachineIntegrationRoute"));

//   app.use(`${rootPathForModule}`, require("./productAuditLogRoute"));
//   app.use(`${rootPathForModule}`, require("./productCategoryRoute"));
//   app.use(`${rootPathForModule}`, require("./productConnectionRoute"));
//   app.use(`${rootPathForModule}`, require("./productDrawingRoute"));
//   app.use(`${rootPathForModule}`, require("./productLicenseRoute"));
//   app.use(`${rootPathForModule}`, require("./productModelRoute"));
//   app.use(`${rootPathForModule}`, require("./productNoteRoute"));
//   app.use(`${rootPathForModule}`, require("./productRoute"));
//   app.use(`${rootPathForModule}`, require("./productStatusRoute"));
//   app.use(`${rootPathForModule}`, require("./productSupplierRoute"));
//   app.use(`${rootPathForModule}`, require("./productTechParamCategoryRoute"));
//   app.use(`${rootPathForModule}`, require("./productTechParamRoute"));
//   app.use(`${rootPathForModule}`, require("./productTechParamValueRoute"));
//   app.use(`${rootPathForModule}`, require("./productToolInstalledRoute"));
//   app.use(`${rootPathForModule}`, require("./productToolRoute"));
//   app.use(`${rootPathForModule}`, require("./productCheckItemsRoute"));
//   app.use(`${rootPathForModule}`, require("./productServiceReportTemplateRoute"));
//   app.use(`${rootPathForModule}`, require("./productServiceReportNotesRoute"));
//   app.use(`${rootPathForModule}`, require("./productServiceReportStatusRoute"));
//   app.use(`${rootPathForModule}`, require("./productServiceReportRoute"));
//   app.use(`${rootPathForModule}`, require("./productServiceReportFileRoute"));
//   app.use(`${rootPathForModule}`, require("./productCheckItemCategoryRoute"));
//   app.use(`${rootPathForModule}`, require("./productProfileRoute"));
//   app.use(`${rootPathForModule}`, require("./productServiceReportValueRoute"));
//   app.use(`${rootPathForModule}`, require("./productServiceReportValueFileRoute"));
//   app.use(`${rootPathForModule}`, require("./categoryGroupRoute"));
//   app.use(`${rootPathForModule}`, require("./productIntegrationRoute"));
