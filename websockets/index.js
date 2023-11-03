const url = require('url');
const mongoose = require('mongoose');

const WebSocket = wss;

const { SecurityUser, SecuritySession, SecurityNotification } = require('../appsrc/modules/security/models');
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

        const session = await SecuritySession.findOne({"session.user":userId,"session.sessionId":sessionId});

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

    

    ws.on('message', async function(data) {

        data = Buffer.from(data,'utf8'.toString());
        try{
            data = JSON.parse(data);
        }catch(e) {
            console.log('Invalid Event data',data,e);
        }
        
        if(data.type=='getNotifications') {
            let notifications = await SecurityNotification.find({receivers:userId,readBy:{$ne:userId}});
            return ws.send(JSON.stringify(notifications));
        }

        if(data.type=='markAsRead') {
            let query = { receivers: userId, readBy: { $ne: userId } };
            let update = { $push: { readBy:userId } };
            let notifications = await SecurityNotification.updateMany(query,update);
            return ws.send(JSON.stringify({success:'yes'}));
        }        


    });


    ws.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + ws.remoteAddress + ' disconnected.');
    });

    
});



function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

function emitEvent(ws,sendEventData = {}) {
  console.log(`\nSending eventName : ${sendEventData.eventName}`);
  console.log(`\nSending eventName : `,JSON.stringify(sendEventData));
  ws.send(Buffer.from(JSON.stringify(sendEventData)));
}

function broadcastEvent(wss, ws, sendEventData = {},socialStats) {
  wss.clients.forEach(function each(client) {
    if (client !== ws && client.readyState === WebSocket.OPEN) {
      emitEvent(client,sendEventData)
      
      if(sendEventData.eventName=='newMessagesSent') {
        socialStats(client);
      }

    }
  });
}

function getSocketConnectionByUserId(userId) {
    let wsConnection = [];

    const WebSocket = wss;

    WebSocket.clients.forEach((client)=> {
        if(client.userId==userId ) {
            wsConnection.push(client);
        }
    });
    
    return wsConnection;
}

exports = {
    WebSocket,
    emitEvent,
    broadcastEvent,
    getSocketConnectionByUserId
}