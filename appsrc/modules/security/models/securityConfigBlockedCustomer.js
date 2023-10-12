const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const GUID = require('mongoose-guid')(mongoose);
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;
const docSchema = new Schema({
        
        blockedCustomer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true},
        // list of black listed IPs                          
},
{
        collection: 'SecurityConfigBlockedCustomers'
});

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('SecurityConfigBlockedCustomer', docSchema);