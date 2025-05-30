//'use strict'

const apiPath = process.env.API_ROOT;
const articleCategoryRoute = require('./articleCategory');

exports.registerArticleCategoryRoutes = (app, apiPath) => {
    // localhost://api/1.0.0/support/settings
    app.use(`${apiPath}/support/settings`, articleCategoryRoute);
}