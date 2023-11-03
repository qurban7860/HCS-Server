const mongoose = require('./appsrc/modules/db/dbConnection');

const App = require('./appsrc/modules/config/server-config.js');
const app = new App();
app.start();

global.wss = app.wss;

global.getSocketConnectionByUserId = function getSocketConnectionByUserId(userId) {
    let wsConnection = [];

    wss.clients.forEach((client)=> {
        if(client.userId==userId ) {
            wsConnection.push(client);
        }
    });
    
    return wsConnection;
}
const {  emitSocketEvent, broadCastSocketEvent } = require('./websockets/index');

global.emitSocketEvent = emitSocketEvent;
global.broadCastSocketEvent = broadCastSocketEvent;
