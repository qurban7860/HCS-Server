const url = require('url');
const mongoose = require('mongoose');

const WebSocket = getWebSocket();

const { SecurityUser, Session } = require('../appsrc/modules/security/models');
WebSocket.on('connection', async function(ws, req) {
    
    let queryString = url.parse(req.url,true).query;
    let isValid = true;

    let userId = queryString['userId'];
    let sessionId = queryString['sessionId'];

    if(userId && mongoose.Types.ObjectId.isValid(userId) && sessionId) {
        const user = await SecurityUser.findById(userId);
        if(!user) {
           isValid = false;
        }
        else {
            ws.userData = user;
            ws.userId = user.id;
            ws.accessToken = user.accessToken;
        }

        const session = await Session.findOne({"session.user":userId,"session.sessionId":sessionId});

        if(!session) {
            isValid =false
        }
        else {
            ws.userData.session = session;
            ws.sessionId = sessionId;
        }
    }
    else {
        isValid = false;
    }


    if(!isValid) {
        console.log('Unauthenticated');
        ws.terminate();
    }

    

    ws.on('message', function(message) {

        if(message.type=='login') {

        }

        ws.send("Received Message");

    });


    ws.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + ws.remoteAddress + ' disconnected.');
    });

    
});



function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

exports = {
    WebSocket,
}