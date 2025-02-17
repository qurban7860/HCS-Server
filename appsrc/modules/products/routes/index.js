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
  techParamReport: require("./protected/productTechParamReportRoute"),
  toolsInstalled: require("./protected/productToolInstalledRoute"),
  tools: require("./protected/productToolRoute"),
  checkItems: require("./protected/productCheckItemsRoute"),
  serviceReportTemplates: require("./protected/productServiceReportTemplateRoute"),
  serviceReportComments: require("./protected/productServiceReportCommentRoute"),
  serviceReportNotes: require("./protected/productServiceReportNoteRoute"),
  serviceReportStatuses: require("./protected/productServiceReportStatusRoute"),
  serviceReports: require("./protected/productServiceReportRoute"),
  serviceReportFiles: require("./protected/productServiceReportFileRoute"),
  checkItemCategories: require("./protected/productCheckItemCategoryRoute"),
  profiles: require("./protected/productProfileRoute"),
  profileFiles: require("./protected/productProfileFileRoute"),
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