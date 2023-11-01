const mongoose = require('./appsrc/modules/db/dbConnection');

const App = require('./appsrc/modules/config/server-config.js');
const app = new App();
app.start();
global.wss = app.wss;

global.getWebSocket = function getWebSocket() {
	return app.wss;
}

global.getSocketConnectionByUserId = function getSocketConnectionByUserId(userId) {
	let wsConnection = [];

	const WebSocket = getWebSocket();

	WebSocket.clients.forEach((client)=> {
		if(client.userId==userId ) {
			wsConnection.push(client);
		}
	});
	
	return wsConnection;
}

require('./websockets/index');

