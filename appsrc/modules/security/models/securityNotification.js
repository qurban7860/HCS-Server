const mongoose = require('mongoose');
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;
const docSchema = new Schema({
        
    sender: { type: Schema.Types.ObjectId, ref: 'SecurityUser' },

    receivers: [{ type: Schema.Types.ObjectId, ref: 'SecurityUser' }],
    
    message: { type: String },
    
    title: { title: String },

    type: { type: String },

    extraInfo: { type: Object },

    readBy: [{ type: Schema.Types.ObjectId, ref: 'SecurityUser' }],

    // deleteBy: [{ type: Schema.Types.ObjectId, ref: 'SecurityUser' }],                       
},
{
        collection: 'SecurityNotifications'
});


docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.index({"receiver":1});
docSchema.index({"readBy":1});


module.exports = mongoose.model('SecurityNotification', docSchema);