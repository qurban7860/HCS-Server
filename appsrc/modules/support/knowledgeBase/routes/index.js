const articleRoute = require('./article');

exports.registerArticleRoutes = (app, apiPath) => {
    // localhost://api/1.0.0/support/knowledgeBase/
    app.use(`${apiPath}/support/knowledgeBase/`, articleRoute);
}