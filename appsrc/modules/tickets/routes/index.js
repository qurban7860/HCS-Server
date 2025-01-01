const ticketRoute = require('./ticketRoute');

exports.registerTicketRoutes = ( app, apiPath ) => {
    const rootPathForModule = `${apiPath}`
    app.use(`${rootPathForModule}`, ticketRoute);
}