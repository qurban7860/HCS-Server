

const express = require('express');
const checkAuth = require('../../../../middleware/check-auth');

exports.registerknowledgeBaseRoutes = (app, apiPath) => {
    const rootPath = `${apiPath}/support/knowledgeBase/`
    const router = express.Router();
    router.use(checkAuth);

    router.use("/article", require('./articleRoute'));
    router.use("/article/:articleId/files", require('./articleFilesRoute'));
    app.use(rootPath, router);
}