const productRoute = require('./productRoute');
const productModelRoute = require('./productModelRoute');
const productCategoryRoute = require('./productCategoryRoute');
const productTechParamValueRoute = require('./productTechParamValueRoute');

exports.registerProductRoutes = (app, apiPath) => {
    const rootPathForModule = `${apiPath}/cp/products`;

    // Mount protected routes with auth middleware
    app.use(`${rootPathForModule}`, productRoute);
    app.use(`${rootPathForModule}`, productModelRoute);
    app.use(`${rootPathForModule}`, productCategoryRoute);
    app.use(`${rootPathForModule}`, productTechParamValueRoute);
}; 