const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const GUID = require('mongoose-guid')(mongoose);
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;
const docSchema = new Schema({
        
        blockedUsers: [{ type: Schema.Types.ObjectId, ref: 'SecurityUser'}],
        // list of black listed IPs
        
        blockedCustomers: [{ type: Schema.Types.ObjectId, ref: 'Customer' }],
        // list of black listed IPs
        
        whiteListIPs: [{ type: String}],
        // list of white IPs
        
        blackListIPs: [{ type: String}]
        // list of black listed IPs
                          
},
{
        collection: 'SecurityConfigs'
});

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('SecurityConfig', docSchema);