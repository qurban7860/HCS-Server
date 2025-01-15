const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const Schema = mongoose.Schema;
const baseSchema = require('../../../base/baseSchema');

const docSchema = new Schema({

    ticket: { type: Schema.Types.ObjectId , ref: 'Ticket', required: true },
    
    comment: { type: String, required: true },
    
    isInternal: { type: Boolean, default: false },
    
},
{
    collection: 'TicketComments'
});
docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.index({"name":1})
docSchema.index({"type":1})
docSchema.index({"isActive":1})
docSchema.index({"isArchived":1})

docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('TicketComment', docSchema);
