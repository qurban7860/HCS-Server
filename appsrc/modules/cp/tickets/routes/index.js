const ticketRoute = require('./ticketRoute');
const ticketHistoryRoute = require('./ticketHistoryRoute');
const ticketCommentRoute = require('./ticketCommentRoute');
const ticketFileRoute = require('./ticketFileRoute');
const changeReasonRoute = require('./changeReasonRoute');
const changeTypeRoute = require('./changeTypeRoute');
const impactRoute = require('./impactRoute');
const investigationReasonRoute = require('./investigationReasonRoute');
const issueTypeRoute = require('./issueTypeRoute');
const priorityRoute = require('./priorityRoute');
const statusRoute = require('./statusRoute');
const statusTypeRoute = require('./statusTypeRoute');

exports.registerTicketRoutes = (app, apiPath) => {
    const rootPathForModule = `${apiPath}/cp/tickets`;

    // Mount protected routes with auth middleware
    // app.use(`${rootPathForModule}`, changeReasonRoute);
    // app.use(`${rootPathForModule}`, changeTypeRoute);
    // app.use(`${rootPathForModule}`, impactRoute);
    // app.use(`${rootPathForModule}`, investigationReasonRoute);
    // app.use(`${rootPathForModule}`, issueTypeRoute);
    // app.use(`${rootPathForModule}`, priorityRoute);
    // app.use(`${rootPathForModule}`, statusRoute);
    // app.use(`${rootPathForModule}`, statusTypeRoute);
    app.use(`${rootPathForModule}`, ticketRoute);
    app.use(`${rootPathForModule}`, ticketHistoryRoute);
    app.use(`${rootPathForModule}`, ticketCommentRoute);
    app.use(`${rootPathForModule}`, ticketFileRoute);
}; 