const changeReasonRoute = require('./changeReasonRoute');
const changeTypeRoute = require('./changeTypeRoute');
const impactRoute = require('./impactRoute');
const investigationReasonRoute = require('./investigationReasonRoute');
const issueTypeRoute = require('./issueTypeRoute');
const priorityRoute = require('./priorityRoute');
const requestTypeRoute = require('./requestTypeRoute');
const statusRoute = require('./statusRoute');
const statusTypeRoute = require('./statusTypeRoute');
const ticketRoute = require('./ticketRoute');
const ticketHistoryRoute = require('./ticketHistoryRoute');
const ticketCommentRoute = require('./ticketCommentRoute');
const ticketWorkLogRoute = require('./ticketWorkLogRoute');
const ticketFileRoute = require('./ticketFileRoute');

exports.registerTicketRoutes = (app, apiPath) => {
    const rootPath = `${apiPath}/tickets`
    app.use(`${rootPath}`, changeReasonRoute);
    app.use(`${rootPath}`, changeTypeRoute);
    app.use(`${rootPath}`, impactRoute);
    app.use(`${rootPath}`, investigationReasonRoute);
    app.use(`${rootPath}`, issueTypeRoute);
    app.use(`${rootPath}`, priorityRoute);
    app.use(`${rootPath}`, requestTypeRoute);
    app.use(`${rootPath}`, statusRoute);
    app.use(`${rootPath}`, statusTypeRoute);
    app.use(`${rootPath}`, ticketRoute);
    app.use(`${rootPath}`, ticketHistoryRoute);
    app.use(`${rootPath}`, ticketCommentRoute);
    app.use(`${rootPath}`, ticketWorkLogRoute);
    app.use(`${rootPath}`, ticketFileRoute);
}