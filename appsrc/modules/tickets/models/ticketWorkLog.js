const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const Schema = mongoose.Schema;
const baseSchema = require('../../../base/baseSchema');

const docSchema = new Schema({
    ticket: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true },
    timeSpent: { type: String, required: true },
    notes: { type: String, maxlength: 300 }, 
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }, 
}, {
    collection: 'TicketWorkLogs' 
});

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.index({ ticket: 1 });
docSchema.index({ createdBy: 1 });
docSchema.index({"isActive":1})
docSchema.index({"isArchived":1})


docSchema.plugin(uniqueValidator); 


module.exports = mongoose.model('TicketWorkLog', docSchema); 

