//'use strict'

const apiPath = process.env.API_ROOT;
const jiraRoute = require('./jiraRoute');


exports.registerJiraRoutes = (app, apiPath) => {
    const rootPathForModule = `${apiPath}/jira`
    app.use(`${rootPathForModule}`, jiraRoute);
}