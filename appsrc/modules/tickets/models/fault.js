const mongoose = require('mongoose');
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;

const docSchema = new Schema({

    name: { type: String, required: true },

    icon: { type: String },

    color: { type: String },

    description: { type: String },

    slug: { type: String },

    displayOrderNo: { type: Number },

    isDefault: { type: Boolean, default: false }
},
    {
        collection: 'TicketFaults'
    });
docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.index({ "isActive": 1 })
docSchema.index({ "isArchived": 1 })

module.exports = mongoose.model('TicketFault', docSchema);
