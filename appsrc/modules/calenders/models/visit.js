const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const GUID = require('mongoose-guid')(mongoose);
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;
const docSchema = new Schema({
        customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },

        contact: [{ type: Schema.Types.ObjectId, ref: 'CustomerContact' }],

        machine: { type: Schema.Types.ObjectId, required: true, ref: 'Machine' },

        site: { type: Schema.Types.ObjectId, ref: 'CustomerSite' }, //if customer and machine is inserted then its installation site is there.

        jiraTicket: { type: String, required: true },

        primaryTechnician: { type: Schema.Types.ObjectId, ref: 'CustomerContact', required: true },     //Howick Technicians

        supportingTechnicians: [{ type: Schema.Types.ObjectId, ref: 'CustomerContact', required: true }], //Howick Technicians

        notifyContacts: [{ type: Schema.Types.ObjectId, ref: 'CustomerContact', required: true }], // All Contacts Howick

        status: {
                type: String,
                enum: ['SCHEDULED', 'IN_PROCESS', 'COMPLETED', 'CANCELLED'],
                default: 'SCHEDULED'
        },


        purposeOfVisit: { type: String, maxlength: 500 },

        visitNote: { type: String, maxlength: 200 },

        visitDate: { type: Date, required: true },
        start: { type: Date },
        end: { type: Date }
},
        {
                collection: 'Visits'
        });

docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);
docSchema.set('timestamps', true);

module.exports = mongoose.model('Visit', docSchema);