const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const baseSchema = require('../../../base/baseSchema');

const GUID = require('mongoose-guid')(mongoose);
const Schema = mongoose.Schema;

const docSchema = new Schema({

    serviceReport: { type: Schema.Types.ObjectId , ref: 'MachineServiceReport', required: true },
    
    type: { type: String, required: true },
    
    note: { type: String, required: true },

    isHistory: {type: Boolean, default: false},
    
},
{
    collection: 'MachineServiceReportNote'
});
docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.index({"name":1})
docSchema.index({"type":1})
docSchema.index({"isActive":1})
docSchema.index({"isArchived":1})

docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('MachineServiceReportNotes', docSchema);
