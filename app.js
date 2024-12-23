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

global.getAllWebSockets = function getAllWebSockets() {
    let wsConnection = [];
    wss.clients.forEach((client)=> {
        wsConnection.push(client);
    });
    return wsConnection;
}

const {  emitEvent, broadcastEvent, closeSocket } = require('./websockets/index');

global.emitEvent = emitEvent;
global.broadcastEvent = broadcastEvent;
global.closeSocket = closeSocket;
