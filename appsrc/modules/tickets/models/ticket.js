const mongoose = require('mongoose');
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;

const docSchema = new Schema({

        ticketNo: { type: String },

        customer: { type: Schema.Types.ObjectId, required: true, ref: 'Customer' },

        machine: { type: Schema.Types.ObjectId, required: true, ref: 'Machine' },

        reporter: { type: Schema.Types.ObjectId, required: true, ref: 'CustomerContact' },

        assignee: { type: Schema.Types.ObjectId, ref: 'CustomerContact' },

        approvers: [{ type: Schema.Types.ObjectId, ref: 'CustomerContact' }],

        changeReason: { type: Schema.Types.ObjectId, ref: 'TicketChangeReason' },

        changeType: { type: Schema.Types.ObjectId, ref: 'TicketChangeType' },

        impact: { type: Schema.Types.ObjectId, ref: 'TicketImpact' },

        investigationReason: { type: Schema.Types.ObjectId, ref: 'TicketInvestigationReason' },

        issueType: { type: Schema.Types.ObjectId, required: true, ref: 'TicketIssueType' },

        requestType: { type: Schema.Types.ObjectId, required: true, ref: 'TicketRequestType' },

        priority: { type: Schema.Types.ObjectId, ref: 'TicketPriority' },

        status: { type: Schema.Types.ObjectId, ref: 'TicketStatus' },

        hlc: { type: String },

        plc: { type: String },

        implementationPlan: { type: String },

        plannedStartDate: { type: Date },

        startTime: { type: Date },

        plannedEndDate: { type: Date },

        endTime: { type: Date },

        backoutPlan: { type: String },

        description: { type: String },

        workaround: { type: String },

        rootCause: { type: String },

        shareWith: { type: Boolean },

        testPlan: { type: String },

        summary: { type: String },

        groups: { type: String },

        files: [{ type: Schema.Types.ObjectId, ref: 'TicketFile' }],

},
        {
                collection: 'Tickets'
        });

docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);
docSchema.set('timestamps', true);
docSchema.index({ "customer": 1 })
docSchema.index({ "machine": 1 })
docSchema.index({ "history.updatedBy": 1, "history.updatedAt": -1 });


module.exports = mongoose.model('Ticket', docSchema);