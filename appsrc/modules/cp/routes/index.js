const configRoutes = require('../config/routes');
const dashboardRoutes = require('../dashboard/routes');
const securityRoutes = require('../security/routes');
const productRoutes = require('../products/routes');
const customerRoutes = require('../crm/routes');
const ticketRoutes = require('../tickets/routes');

exports.registerCustomerPortalRoutes = (app, apiPath) => {
    configRoutes.registerConfigRoutes(app, apiPath);
    dashboardRoutes.registerDashboardRoutes(app, apiPath);
    securityRoutes.registerSecurityRoutes(app, apiPath);
    productRoutes.registerProductRoutes(app, apiPath);
    customerRoutes.registerCustomerRoutes(app, apiPath);
    ticketRoutes.registerTicketRoutes(app, apiPath);
}; 