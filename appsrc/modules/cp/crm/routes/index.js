const publicRoutes = {
    portalRegistrationRequestRoute: require('./portalRegistrationRequest'),
}

const protectedRoutes = {
    customerRoute: require('./customerRoute'),
    customerSiteRoute: require('./customerSiteRoute'),
    customerContactRoute: require('./customerContactRoute'),
}

exports.registerCustomerRoutes = (app, apiPath) => {
    const rootPathForModule = `${apiPath}/cp/crm`;
  
    // public/nonAuth routes mounted
    Object.entries(publicRoutes).forEach(([name, router]) => {
      app.use(`${rootPathForModule}/public`, router);
    });
  
    // Mount protected routes with auth middleware
    Object.entries(protectedRoutes).forEach(([name, router]) => {
      app.use(`${rootPathForModule}`, router);
    });
}; 