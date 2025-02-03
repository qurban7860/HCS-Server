const securityRoleRoute = require('./securityRoleRoute');
const securityAuthenticationRoute = require('./securityAuthenticationRoute');
const securityUserRoute = require('./securityUserRoute');
const securityUserInvitationRoute = require('./securityUserInvitationRoute');

exports.registerSecurityRoutes = (app, apiPath) => {
    const rootPathForModule = `${apiPath}/cp/security`

    // localhost://api/1.0.0/cp/security/
    app.use(`${rootPathForModule}`, securityAuthenticationRoute);
    
    // localhost://api/1.0.0/cp/security/
    app.use(`${rootPathForModule}`, securityRoleRoute);    

    // localhost://api/1.0.0/cp/security/
    app.use(`${rootPathForModule}`, securityUserRoute);

    // localhost://api/1.0.0/cp/security/
    app.use(`${rootPathForModule}`, securityUserInvitationRoute);
} 