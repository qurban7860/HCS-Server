//'use strict'

// Public Routes (no auth required)
const publicRoutes = {
  publicLogRoute: require("./public/publicLogRoute"),
};

// Protected Routes (requiring auth)
const protectedRoutes = {
  logRoute: require("./protected/logRoute"),
};

exports.registerProductLogsRoutes = (app, apiPath) => {
  const rootPathForModule = `${apiPath}/productLogs`;

  // public/nonAuth routes mounted
  Object.entries(publicRoutes).forEach(([name, router]) => {
    app.use(`${rootPathForModule}/public`, router);
  });

  // Mount protected routes with auth middleware
  Object.entries(protectedRoutes).forEach(([name, router]) => {
    app.use(`${rootPathForModule}`, router);
  });
};
