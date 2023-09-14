const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;
const docSchema = new Schema({
        
    user: { type: Schema.Types.ObjectId, ref: 'SecurityUser' },
    // guid of user from users collection.
    
    loginTime: { type: Date , default: Date.now, required: true },
    // login time of user
    
    logoutTime: { type: Date  },
    // logout time of user
    
    loginIP: { type: String }
    // information of IP address from where action is performed

    // information of IP address from where action is performed
                          
},
{
        collection: 'SecuritySignInLogs'
});

docSchema.plugin(uniqueValidator);

docSchema.index({"user":1})
docSchema.index({"loginTime":1})

module.exports = mongoose.model('SecuritySignInLog', docSchema);