const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const baseSchema = require('../../../base/baseSchema');

const GUID = require('mongoose-guid')(mongoose);
const Schema = mongoose.Schema;

const docSchema = new Schema({
    icon: { type: String , required: true },

    name: { type: String , required: true },
    
    description: { type: String },

    slug: { type: String },
    
    displayOrderNo: { type: Number },
    
    isDefault: { type: Boolean, default:false }
},
{
    collection: 'TicketPriorities'
});
docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.index({"name":1})
docSchema.index({"slug":1})
docSchema.index({"isActive":1})
docSchema.index({"isArchived":1})

docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('TicketPriority', docSchema);
