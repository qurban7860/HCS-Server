const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;
const docSchema = new Schema({
        
    user: { type: Schema.Types.ObjectId, ref: 'SecurityUser' },
    // guid of user from users collection.
    
    activityType: {type: String},
    // type of activity like new, update, delete, etc
    
    activitySummary:{type: String, required: true},
    // short summary like add customer, update customer , etc
    
    activityDetail:{type: String, required: true},
    // detail of data object saved for tracking purpose
    
    createdAt: { type: Date , default: Date.now, required: true },
    // Date/Time for record creation.
    
    createdBy: { type: Schema.ObjectId , ref: "SecurityUser" }, 
    // information of userid/login who created this
    
    createdIP: { type: String }
    // information of IP address from where action is performed
                          
},
{
        collection: 'SecurityAuditLogs'
});

docSchema.plugin(uniqueValidator);

docSchema.index({"user":1})

module.exports = mongoose.model('SecurityAuditLog', docSchema);