const url = require('url');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const WebSocket = wss;

const { SecurityUser, SecuritySession, SecurityNotification } = require('../appsrc/modules/security/models');
WebSocket.on('connection', async function(ws, req) {
    try{
        let queryString = url.parse(req.url,true).query;
        let isValid = true;

        const token = queryString['accessToken'];
        
        if(!token) {
            console.log('Unauthenticated');
            closeSocket(ws);
        }
        
        const decodedToken = jwt.verify(token, process.env.JWT_SECRETKEY);
        const userId = decodedToken['userId'];
        const sessionId = decodedToken['sessionId'];
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
            closeSocket(ws);

        }
    }catch(e) {
        console.log('WebSocket connection closed due to exception');
        console.log(e);
        closeSocket(ws);

    }

    

    ws.on('message', async function(data) {

        data = Buffer.from(data,'utf8'.toString());
        try{
            data = JSON.parse(data);
        }catch(e) {
            console.log('Invalid Event data',data,e);
        }
        
        let eventName = data.eventName;

        let sendEventData = {};
        if(eventName=='getNotifications') {
            let notifications = await SecurityNotification.find({receivers:userId,readBy:{$ne:userId}});
            sendEventData = { eventName:'notificationsSent', data : notifications };
            emitEvent(ws,sendEventData)
        }

        if(eventName=='markAsRead') {
            let query = { receivers: userId, readBy: { $ne: userId } };
            let update = { $push: { readBy:userId } };
            let notifications = await SecurityNotification.updateMany(query,update);
            sendEventData = { eventName:'readMarked', data : {success:'yes'} };
            emitEvent(ws,sendEventData)
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

function closeSocket(ws) {
    ws.terminate();
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



exports = {
    WebSocket,
    emitEvent,
    broadcastEvent,
    closeSocket
}