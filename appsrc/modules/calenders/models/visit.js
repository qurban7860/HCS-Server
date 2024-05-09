const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const GUID = require('mongoose-guid')(mongoose);
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;
const docSchema = new Schema({
        customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },

        site: { type: Schema.Types.ObjectId, ref: 'CustomerSite' },

        contact: { type: Schema.Types.ObjectId, ref: 'CustomerContact' },

        machine: { type: Schema.Types.ObjectId, required: true, ref: 'Machine' },

        jiraTicket: { type: String, required: true },

        technicians: [{ type: Schema.Types.ObjectId, ref: 'SecurityUsers', required: true }],
        
        status: {
                type: String,
                enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
                default: 'scheduled'
        },
        
        title: { type: String, maxlength: 200 },
        
        description: { type: String, maxlength: 200 },
        
        start: { type: Date, required: true },
        
        end: { type: Date, required: true },
        
        completedBy: [{ type: Schema.Types.ObjectId, ref: 'SecurityUsers', required: true }],
},
        {
                collection: 'Visits'
        });

docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);
docSchema.set('timestamps', true);

module.exports = mongoose.model('Visit', docSchema);