//'use strict'

const publicRoutes = {
    portalRegistrationRequestRoute: require('./public/portalRegistrationRequest'),
}

const protectedRoutes = {
    customerRoute: require('./protected/customerRoute'),
    customerSiteRoute: require('./protected/customerSiteRoute'),
    customerContactRoute: require('./protected/customerContactRoute'),
    customerNoteRoute: require('./protected/customerNoteRoute'),
    departmentRoute: require('./protected/departmentRoute'),
    portalRegistration: require('./protected/portalRegistration')
}

exports.registerCustomerRoutes = (app, apiPath) => {
    const rootPathForModule = `${apiPath}/crm`;
  
    // public/nonAuth routes mounted
    Object.entries(publicRoutes).forEach(([name, router]) => {
      app.use(`${rootPathForModule}/public`, router);
    });
  
    // Mount protected routes with auth middleware
    Object.entries(protectedRoutes).forEach(([name, router]) => {
      app.use(`${rootPathForModule}`, router);
    });
  
  };