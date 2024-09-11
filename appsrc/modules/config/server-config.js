const apiPath = process.env.API_ROOT;

const fs         = require('fs');
const path       = require('path');
const express = require('express');
const { WebSocketServer, WebSocket } = require('ws');
const http = require('http');

const bodyParser = require('body-parser');
const cors = require('cors')
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

let dburl = `mongodb://${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/${process.env.MONGODB_NAME}`

if (process.env.MONGODB_HOST_TYPE && process.env.MONGODB_HOST_TYPE == "mongocloud"){
    dburl = `mongodb+srv://${ process.env.MONGODB_USERNAME }:${ process.env.MONGODB_PASSWD }@${ process.env.MONGODB_HOST }/${ process.env.MONGODB_NAME }?retryWrites=true&w=majority`;
}

const store = new MongoDBStore({
    uri: dburl,
    collection: 'SecuritySessions'
});

// MIDDLEWARE
const setHeaders = require('../../middleware/set-header');
const errorHandler = require('../../middleware/error-handler');

// ROUTES
const productRoutes  = require ('../products/routes');
const securityRoutes  = require ('../security/routes');
const customerRoutes  = require ('../crm/routes');
const dashboardRoute  = require ('../dashboard/routes');
const documentRoute  = require ('../documents/routes');
const emailRoute  = require ('../email/routes');
const regionRoute  = require ('../regions/routes');
const calenderRoute  = require ('../calenders/routes');

const apiclientRoute  = require ('../apiclient/routes');

const configRoute  = require ('../config/routes');
const logRoute  = require ('../log/routes');
const productLogs  = require ('../productLogs/routes');
const jiraRoute  = require ('../jira/routes');

const backupRoute  = require ('../backups/routes');


const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../../../openapi.json');

const morgan = require('morgan');

/**
 * This class is the main App entry point.
 *
 * It sets up
 *  - DB connection to Mongo
 *  - Express middleware
 */
class App {
  /**
   * - Assigns Express app object to this
   *
   * @param  app An ExpressJS app object
   */
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);

    this.MORGAN_FORMAT = process.env.MORGAN_FORMAT != undefined && process.env.MORGAN_FORMAT != null && process.env.MORGAN_FORMAT.length > 0 ? process.env.MORGAN_FORMAT : 'common' ;
    this.app.use(morgan(this.MORGAN_FORMAT));  
    this.app.use(bodyParser.json({limit: '50mb'}));
    this.app.use(bodyParser.urlencoded({limit: '50mb'}));
    this.app.use('/uploads/images', express.static(path.join('uploads', 'images')));
    this.app.use(setHeaders);
    
    this.app.use('/api/1.0.0/security/getToken/',session({
      secret: process.env.SESSION_SECRETKEY,
      resave: true,
      store: store
    }));

    this.app.use('/api/1.0.0/customer/getToken/',session({
      secret: process.env.SESSION_SECRETKEY,
      resave: true,
      store: store
    }));
    
    
    
    let allowedOrigins;
    if(process.env.CORS_CONFIG) {
      allowedOrigins = process.env.CORS_CONFIG.split(",");
    }
    
    this.app.use(cors({
        origin: function (origin, callback) {
          if (!allowedOrigins || allowedOrigins.includes(origin)) {
              callback(null, true);
          } else {
            // let sac = require('../security/controllers/securityAuthenticationController');
            // sac.addAccessLog();
            // let securityDBService = require('../security/service/securityDBService');
            // const dbService = this.dbservice = new securityDBService();
            // const clientIP = req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress;
            // const securityLogs = addAccessLog('CORS_ERROR', req.body.email, null, clientIP);
            // dbService.postObject(securityLogs, callbackFunc);
            // async function callbackFunc(error, response) {
            //   if (error) {
            //     logger.error(new Error(error));
            //   } else {
            //     res.status(StatusCodes.UNAUTHORIZED).send("Access to this resource is forbidden"+(!matchedwhiteListIPs ? ".":"!"));
            //   }
            // }
              callback(new Error('Not allowed by CORS'));
          }
        }
    }));

    this.registerRoutes();
    
    // Check if this line is being reached
    
    // this.app.options('*', cors());
    this.app.use(
      '/api-docs',
      swaggerUi.serve,
      swaggerUi.setup(swaggerDocument)
    );

    this.app.use(errorHandler);
  }

  registerRoutes(){    
    productRoutes.registerProductRoutes(this.app, apiPath);
    customerRoutes.registerCustomerRoutes(this.app, apiPath);
    securityRoutes.registerSecurityRoutes(this.app, apiPath);
    dashboardRoute.registerDashboardRoutes(this.app, apiPath);
    documentRoute.registerDocumentRoutes(this.app, apiPath);
    emailRoute.registerEmailRoutes(this.app, apiPath);
    regionRoute.registerRegionRoutes(this.app, apiPath);
    calenderRoute.registerEventRoutes(this.app, apiPath);
    apiclientRoute.registerapiClientRoutes(this.app, apiPath); 
    configRoute.registerConfigRoutes(this.app, apiPath);
    logRoute.registerlogRoutes(this.app, apiPath);
    productLogs.registerProductLogsRoutes(this.app, apiPath);
    jiraRoute.registerJiraRoutes(this.app, apiPath);
    backupRoute.registerBackupRoutes(this.app, apiPath);
  }




  start(){

    try {

      this.wss = new WebSocketServer({
        server: this.server,
        autoAcceptConnections: false
      });

      this.server.listen({port: process.env.PORT || 3001}, () => {
        console.log(`Listening at  http://${process.env.HOST_NAME}:${process.env.PORT}/`)
      });


    } catch (error) {
      console.log(error);
    }    
  }
}

module.exports = App;
