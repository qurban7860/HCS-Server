const mongoose = require('mongoose');
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;

const docSchema = new Schema({

        ticketNo: { type: String },

        customer: { type: Schema.Types.ObjectId, required: true, ref: 'Customer' },

        machine: { type: Schema.Types.ObjectId, required: true, ref: 'Machine' },

        issueType: { type: Schema.Types.ObjectId, required: true, ref: 'TicketIssueType' },

        reporter: { type: Schema.Types.ObjectId, required: true, ref: 'CustomerContact' },

        assignee: { type: Schema.Types.ObjectId, ref: 'CustomerContact' },
        
        description: { type: String  },

        summary: { type: String  },

        changeType: { type: Schema.Types.ObjectId, ref: 'TicketChangeType' },

        impact: { type: Schema.Types.ObjectId, ref: 'TicketImpact' },

        priority: { type: Schema.Types.ObjectId, ref: 'TicketPriority' },

        status: { type: Schema.Types.ObjectId, ref: 'TicketStatus' },

        files: [{ type: Schema.Types.ObjectId, ref: 'TicketFile' }],

        changeReason: { type: Schema.Types.ObjectId, ref: 'TicketChangeReason' },

        implementationPlan: { type: String  },

        backoutPlan: { type: String  },

        testPlan: { type: String  },

        groups: { type: String  },

        shareWith: { type: Boolean },

        investigationReason: { type: Schema.Types.ObjectId, ref: 'TicketInvestigationReason' },

        rootCause: { type: String  },

        workaround: { type: String  },

        plannedStartDate: { type: Date  },

        plannedEndDate: { type: Date  },
        
},
{
        collection: 'Tickets'
});

docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);
docSchema.set('timestamps', true);
docSchema.index({"customer":1})
docSchema.index({"machine":1})
docSchema.index({ "history.updatedBy": 1, "history.updatedAt": -1 });


module.exports = mongoose.model('Ticket', docSchema);