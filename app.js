const mongoose = require('./appsrc/modules/db/dbConnection');

const App = require('./appsrc/modules/config/server-config.js');
const app = new App();


app.start();
