const mongoose = require('mongoose');
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;

const docSchema = new Schema({

        ticket: { type: String, required: true, ref: 'Ticket' },

        previousReporter: { type: Schema.Types.ObjectId, required: true, ref: 'CustomerContact' },
        newReporter: { type: Schema.Types.ObjectId, required: true, ref: 'CustomerContact' },

        previousAssignee: { type: Schema.Types.ObjectId, required: true, ref: 'CustomerContact' },
        newAssignee: { type: Schema.Types.ObjectId, required: true, ref: 'CustomerContact' },

        previousPriority: { type: Schema.Types.ObjectId, ref: 'TicketPriority' },
        newPriority: { type: Schema.Types.ObjectId, ref: 'TicketPriority' },
        
        previousStatus: { type: Schema.Types.ObjectId, ref: 'TicketStatus' },
        newStatus: { type: Schema.Types.ObjectId, ref: 'TicketStatus' },
        
},
{
        collection: 'TicketChangeHistories'
});

docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);
docSchema.set('timestamps', true);
docSchema.index({"ticket":1})
docSchema.index({"updatedBy": 1, "updatedAt": -1 });


module.exports = mongoose.model('TicketChangeHistory', docSchema);