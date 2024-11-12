const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const baseSchema = require('../../../base/baseSchema');

const GUID = require('mongoose-guid')(mongoose);
const Schema = mongoose.Schema;

const docSchema = new Schema({

    comment: { type: String, default: "" },

    serviceReportId: { type: Schema.Types.ObjectId , ref: 'MachineServiceReport' },

    primaryServiceReportId: { type: Schema.Types.ObjectId , ref: 'MachineServiceReport' },

    status: { type: Schema.Types.ObjectId , ref: 'MachineServiceReportStatus' },

},
{
    collection: 'MachineServiceReportComment'
});
docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.index({"name":1})
docSchema.index({"type":1})
docSchema.index({"isActive":1})
docSchema.index({"isArchived":1})

docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('MachineServiceReportComment', docSchema);
