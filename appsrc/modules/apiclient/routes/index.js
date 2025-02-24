//'use strict'

// Public Routes (no auth required)
const publicRoutes = {
    productConfigurationRoute: require('./public/productConfigurationRoute')
};

// Protected Routes (requiring auth)
const protectedRoutes = {
    apilogRoute: require('./protected/apilogRoute'),
    productConfigurationRoute: require('./protected/productConfigurationRoute')
};

exports.registerapiClientRoutes = (app, apiPath) => {
    const rootPathForModule = `${apiPath}/apiclient`;

    // public/nonAuth routes mounted
    Object.entries(publicRoutes).forEach(([name, router]) => {
        app.use(`${rootPathForModule}/public`, router);
    });

    // Mount protected routes with auth middleware
    Object.entries(protectedRoutes).forEach(([name, router]) => {
        app.use(`${rootPathForModule}`, router);
    });

};