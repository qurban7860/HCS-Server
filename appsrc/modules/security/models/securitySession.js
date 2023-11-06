const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const docSchema = new Schema({
    
    expires : {type: Date},
    session : {
        cookie : {
            originalMaxAge : {type:Boolean},
            expires : {type:Date},
            secure : {type:Boolean},
            httpOnly : {type:Boolean},
            domain : {type:String},
            path : {type:String},
            sameSite : {type:Boolean}
        },
        isLoggedIn : {type:Boolean},
        userId : { type: Schema.ObjectId , ref: "SecurityUser" },
        sessionId:{type:String}
    },
                          
},
{
        collection: 'SecuritySessions'
});

docSchema.index({"session.isLoggedIn":1})
docSchema.index({"session.userId":1})
docSchema.index({"session.sessionId":1})


module.exports = mongoose.model('SecuritySession', docSchema);