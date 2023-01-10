const mongoose = require('./appsrc/modules/db/dbConnection');

const App = require('./config/server-config');
const app = new App();
app.start();