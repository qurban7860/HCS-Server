//'use strict'

const apiPath = process.env.API_ROOT;
const securityModuleRoute = require('./securityModuleRoute');
const securityRoleRoute = require('./securityRoleRoute');
const securityConfigRoute = require('./securityConfigRoute');
const securityAuthenticationRoute = require('./securityAuthenticationRoute');
const customerAuthenticationRoute = require('./customerAuthenticationRoute');

const securityUserRoute = require('./securityUserRoute');
const securityAuditLogRoute = require('./securityAuditLogRoute');
const securitySignInLogRoute = require('./securitySignInLogRoute');
const securityNoteRoute = require('./securityNoteRoute');
const securityUserInvitationRoute = require('./securityUserInvitationRoute');


const securityConfigBlockedUserRoute = require('./securityConfigBlockedUserRoute');
const securityConfigBlockedCustomerRoute = require('./securityConfigBlockedCustomerRoute');
const securityConfigWhiteListIPRoute = require('./securityConfigWhiteListIPRoute');
const securityConfigBlackListIPRoute = require('./securityConfigBlackListIPRoute');


// const securityInviteRoute = require('./securityInviteRoute');

exports.registerSecurityRoutes = (app, apiPath) => {
    const rootPathForModule = `${apiPath}/security`

    // localhost://api/1.0.0/security/
    app.use(`${rootPathForModule}`, securityAuthenticationRoute);

    // localhost://api/1.0.0/customer/
    app.use(`${rootPathForModule}`, customerAuthenticationRoute);

    // localhost://api/1.0.0/security/
    app.use(`${rootPathForModule}`, securityModuleRoute);
    
    // localhost://api/1.0.0/security/
    app.use(`${rootPathForModule}`, securityRoleRoute);    

    // localhost://api/1.0.0/security/
    app.use(`${rootPathForModule}`, securityConfigRoute);

    // localhost://api/1.0.0/security/
    app.use(`${rootPathForModule}`, securityUserRoute);

    // localhost://api/1.0.0/security/
    app.use(`${rootPathForModule}`, securityAuditLogRoute);

    // localhost://api/1.0.0/security/
    app.use(`${rootPathForModule}`, securitySignInLogRoute);

    // localhost://api/1.0.0/security/
    app.use(`${rootPathForModule}`, securityNoteRoute);

    // localhost://api/1.0.0/security/
    app.use(`${rootPathForModule}`, securityUserInvitationRoute);


    app.use(`${rootPathForModule}`, securityConfigBlockedUserRoute);
    app.use(`${rootPathForModule}`, securityConfigBlockedCustomerRoute);
    app.use(`${rootPathForModule}`, securityConfigWhiteListIPRoute);
    app.use(`${rootPathForModule}`, securityConfigBlackListIPRoute);
    


    // // localhost://api/1.0.0/security/
    // app.use(`${rootPathForModule}`, securityInviteRoute);

}