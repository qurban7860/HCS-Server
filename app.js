const mongoose = require('./appsrc/modules/db/dbConnection');

const App = require('./appsrc/modules/config/server-config.js');
const app = new App();
app.start();

global.wss = app.wss;

const {  emitSocketEvent, broadCastSocketEvent, getSocketConnectionByUserId } = require('./websockets/index');

global.getSocketConnectionByUserId = getSocketConnectionByUserId;
global.emitSocketEvent = emitSocketEvent;
global.broadCastSocketEvent = broadCastSocketEvent;
