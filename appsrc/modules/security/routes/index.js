//'use strict'

const apiPath = process.env.API_ROOT;
const securityModuleRoute = require('./securityModuleRoute');
const securityRoleRoute = require('./securityRoleRoute');
const securityConfigRoute = require('./securityConfigRoute');
const securityAuthenticationRoute = require('./securityAuthenticationRoute');

const securityUserRoute = require('./securityUserRoute');
const securityAuditLogRoute = require('./securityAuditLogRoute');
const securitySignInLogRoute = require('./securitySignInLogRoute');
const securityNoteRoute = require('./securityNoteRoute');

exports.registerSecurityRoutes = (app, apiPath) => {
    const rootPathForModule = `${apiPath}/security`

    // localhost://api/1.0.0/security/
    app.use(`${rootPathForModule}`, securityAuthenticationRoute);

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

}