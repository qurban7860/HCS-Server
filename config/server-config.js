const apiPath = process.env.API_ROOT;

const fs         = require('fs');
const path       = require('path');
const express = require('express');
const bodyParser = require('body-parser');

// MIDDLEWARE
const setHeaders = require('../middleware/set-header');
const errorHandler = require('../middleware/error-handler');

// ROUTES
const usersRoutes = require('../appsrc/modules/user/routes/users-routes');
const assetsRoutes = require('../appsrc/modules/asset/routes/assets-routes');
const departmentRoutes = require('../appsrc/modules/department/routes/department-routes');
const locationRoutes = require('../appsrc/modules/location/routes/location-routes');


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
    this.app.use('/uploads/images', express.static(path.join('uploads', 'images')));
    this.app.use(setHeaders);
    this.app.use(bodyParser.json());
    this.registerRoutes();
    this.app.use(errorHandler);
  }

  registerRoutes(){
    this.app.use(`${ apiPath }/users`, usersRoutes);
    this.app.use(`${ apiPath }/assets`, assetsRoutes);
    this.app.use(`${ apiPath }/locations`, locationRoutes);
    this.app.use(`${ apiPath }/departments`, departmentRoutes);
  }

  start(){
        try {
          this.app.listen({port: process.env.PORT || 3001}, () => {
            console.log(`Listening at  http://${process.env.HOST_NAME}:${process.env.PORT}/`)
          })

        } catch (error) {
          console.log(error);
        }    
  }
}

module.exports = App;
