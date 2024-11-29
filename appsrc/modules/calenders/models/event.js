const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const GUID = require('mongoose-guid')(mongoose);
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;
const docSchema = new Schema({

        isCustomerEvent: { type: Boolean, default: true },
        
        priority: { type: String },
        
        customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },

        contact: [{ type: Schema.Types.ObjectId, ref: 'CustomerContact' }],

        machines: [{ type: Schema.Types.ObjectId, ref: 'Machine' }],

        site: { type: Schema.Types.ObjectId, ref: 'CustomerSite' },

        jiraTicket: { type: String },

        primaryTechnician: { type: Schema.Types.ObjectId, ref: 'CustomerContact', required: true },     //Howick Technicians

        supportingTechnicians: [{ type: Schema.Types.ObjectId, ref: 'CustomerContact', required: true }], //Howick Technicians

        notifyContacts: [{ type: Schema.Types.ObjectId, ref: 'CustomerContact', required: true }], // All Contacts Howick

        status: {  type: String },

        // status: {  type: String,
        //         enum: ['SCHEDULED', 'IN_PROCESS', 'COMPLETED', 'CANCELLED'],
        //         default: 'SCHEDULED'
        // },

        description: { type: String, maxlength: 500 },

        note: { type: String, maxlength: 200 },

        start: { type: Date, required: true },
        end: { type: Date }
},
        {
                collection: 'Events'
        });

docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);
docSchema.set('timestamps', true);

module.exports = mongoose.model('Event', docSchema);