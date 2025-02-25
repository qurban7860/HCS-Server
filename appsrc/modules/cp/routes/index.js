const configRoutes = require('../config/routes');
const customerRoutes = require('../crm/routes');
const dashboardRoutes = require('../dashboard/routes');
const documentRoutes = require('../document/routes');
const productRoutes = require('../products/routes');
const productLogsRoutes = require('../productLogs/routes');
const securityRoutes = require('../security/routes');
const ticketRoutes = require('../tickets/routes');

exports.registerCustomerPortalRoutes = (app, apiPath) => {
    configRoutes.registerConfigRoutes(app, apiPath);
    customerRoutes.registerCustomerRoutes(app, apiPath);
    dashboardRoutes.registerDashboardRoutes(app, apiPath);
    documentRoutes.registerDocumentRoutes(app, apiPath);
    productRoutes.registerProductRoutes(app, apiPath);
    productLogsRoutes.registerProductLogsRoutes(app, apiPath);
    securityRoutes.registerSecurityRoutes(app, apiPath);
    ticketRoutes.registerTicketRoutes(app, apiPath);
}; 