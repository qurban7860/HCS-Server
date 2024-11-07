//'use strict'

// Public Routes (no auth required)
const publicRoutes = {
  machineIntegration: require("./public/productMachineIntegrationRoute"),
};

// Protected Routes (requiring auth)
const protectedRoutes = {
  auditLogs: require("./protected/productAuditLogRoute"),
  categories: require("./protected/productCategoryRoute"),
  connections: require("./protected/productConnectionRoute"),
  drawings: require("./protected/productDrawingRoute"),
  licenses: require("./protected/productLicenseRoute"),
  models: require("./protected/productModelRoute"),
  notes: require("./protected/productNoteRoute"),
  products: require("./protected/productRoute"),
  statuses: require("./protected/productStatusRoute"),
  suppliers: require("./protected/productSupplierRoute"),
  techParamCategories: require("./protected/productTechParamCategoryRoute"),
  techParams: require("./protected/productTechParamRoute"),
  techParamValues: require("./protected/productTechParamValueRoute"),
  toolsInstalled: require("./protected/productToolInstalledRoute"),
  tools: require("./protected/productToolRoute"),
  checkItems: require("./protected/productCheckItemsRoute"),
  serviceReportTemplates: require("./protected/productServiceReportTemplateRoute"),
  serviceReportNotes: require("./protected/productServiceReportNotesRoute"),
  serviceReportStatuses: require("./protected/productServiceReportStatusRoute"),
  serviceReports: require("./protected/productServiceReportRoute"),
  serviceReportFiles: require("./protected/productServiceReportFileRoute"),
  checkItemCategories: require("./protected/productCheckItemCategoryRoute"),
  profiles: require("./protected/productProfileRoute"),
  serviceReportValues: require("./protected/productServiceReportValueRoute"),
  serviceReportValueFiles: require("./protected/productServiceReportValueFileRoute"),
  categoryGroups: require("./protected/categoryGroupRoute"),
  integrations: require("./protected/productIntegrationRoute"),
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
