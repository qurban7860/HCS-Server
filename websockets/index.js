const url = require('url');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const WebSocket = wss;

const { SecurityUser, SecuritySession, SecurityNotification } = require('../appsrc/modules/security/models');
WebSocket.on('connection', async function(ws, req) {
    let userId = null;
    try{
        let queryString = url.parse(req.url,true).query;
        let isValid = true;

        const token = queryString['accessToken'];
        
        if(!token) {
            console.log('Unauthenticated');
            closeSocket(ws);
        }
        
        const decodedToken = jwt.verify(token, process.env.JWT_SECRETKEY);
        userId = decodedToken['userId'];
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
            let queryString__ =  {receivers:userId, isActive: true, isArchived: false};
            let notifications = await SecurityNotification.find(queryString__).sort({createdAt: -1}).populate('sender');
            sendEventData = { eventName:'notificationsSent', data : notifications };
            emitEvent(ws, sendEventData);
        }

        // if(eventName=='markAsRead') {
        //     let query = { receivers: userId, readBy: { $ne: userId } };
        //     if(data._id && mongoose.Types.ObjectId.isValid(data._id)) {
        //         query._id = data._id;
        //     }

        //     let update = { $push: { readBy:userId } };
        //     let notifications = await SecurityNotification.updateMany(query,update);
        //     sendEventData = { eventName:'readMarked', data : {success:'yes'} };
        //     emitEvent(ws,sendEventData)


        //     let queryString__ =  {receivers:userId, isActive: true, isArchived: false};
        //     notifications = await SecurityNotification.find(queryString__).populate('sender');
        //     sendEventData = { eventName:'notificationsSent', data : notifications };
        //     emitEvent(ws, sendEventData);
        // }

        if(eventName=='markAs') {
            let status = data.status;
            if(status) {
                let query = { receivers: userId, readBy: { $ne: userId } };
                
                if(data._id && mongoose.Types.ObjectId.isValid(data._id)) {
                    query._id = data._id;
                }
    
                let update = { $push: { readBy:userId } };
                let notifications = await SecurityNotification.updateMany(query,update);
                sendEventData = { eventName:'readMarked', data : {success:'yes'} };
                emitEvent(ws,sendEventData)
            } else {
                if(data._id && mongoose.Types.ObjectId.isValid(data._id)) {
                    let query = { receivers: userId, readBy: userId, _id: data._id };
                    let update = { $pull: { readBy:userId } };
                    
    
                    let notifications = await SecurityNotification.updateMany(query,update);
                    sendEventData = { eventName:'readMarked', data : {success:'yes'} };
                    emitEvent(ws,sendEventData)
                }
            }
            

            let queryString__ =  {receivers:userId, isActive: true, isArchived: false};
            notifications = await SecurityNotification.find(queryString__).populate('sender');
            sendEventData = { eventName:'notificationsSent', data : notifications };
            emitEvent(ws, sendEventData);
        }


        // if(eventName=='markAsUnRead') {
        //     if(data._id && mongoose.Types.ObjectId.isValid(data._id)) {
        //         let query = { receivers: userId, readBy: userId, _id: data._id };
        //         let update = { $pull: { readBy:userId } };
                

        //         let notifications = await SecurityNotification.updateMany(query,update);
        //         sendEventData = { eventName:'readMarked', data : {success:'yes'} };
        //         emitEvent(ws,sendEventData)
        //     }

        //     let queryString__ =  {receivers:userId, isActive: true, isArchived: false};
        //     notifications = await SecurityNotification.find(queryString__).populate('sender');
        //     sendEventData = { eventName:'notificationsSent', data : notifications };
        //     emitEvent(ws, sendEventData);
        // }
        
        

        if(eventName=='markAsArchived') {
            let query = { receivers: userId};
            if(data._id && mongoose.Types.ObjectId.isValid(data._id)) {
                query._id = data._id;
                let update = { isArchived: true };
                let notifications = await SecurityNotification.query(query,update);
                sendEventData = { eventName:'readMarked', data : {success:'yes'} };
            } else {
                sendEventData = { eventName:'markAsArchived', data : {success:'no'} };
            }
            emitEvent(ws,sendEventData)
        }
        
        


        if(eventName=='getOnlineUsers') {
            const userIds = []
            WebSocket.clients.forEach((client)=> {
                userIds.push(client.userId);
            });
            broadcastEvent(WebSocket, {'eventName':'onlineUsers',userIds})

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
//   console.log(`\nSending eventName : ${sendEventData.eventName}`);
//   console.log(`\nSending eventName : `,JSON.stringify(sendEventData));
  ws.send(Buffer.from(JSON.stringify(sendEventData)));
}

function broadcastEvent(wss, sendEventData = {}) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      emitEvent(client,sendEventData)
    }
  });
}



exports = {
    WebSocket,
    emitEvent,
    broadcastEvent,
    closeSocket
}