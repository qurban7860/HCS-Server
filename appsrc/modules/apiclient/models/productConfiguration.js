const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const baseSchema = require('../../../base/baseSchema');

const GUID = require('mongoose-guid')(mongoose);


const Schema = mongoose.Schema;

const docSchema = new Schema({
    backupid: { type: String , required: true },

    inputGUID: { type: String , required: true },

    inputSerialNo: { type: String , required: true },
    // Serial No of machine

    type: {type: String, enum: ['CLIENT','SYSTEM'], default: 'SYSTEM'},
    //type means from our application or from client application.

    machine: { type: Schema.Types.ObjectId, ref: 'Machine' },

    configuration: { type: Schema.Types.Mixed },
    // configuration Object Received.

    isManufacture: { type: Boolean, default: false },

    backupDate: { type: Date, default: false },

},
{
    collection: 'MachineConfigurations'
});
docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.plugin(uniqueValidator);

docSchema.index({"machine":1})
docSchema.index({"serialNo":1})
docSchema.index({"isActive":1})
docSchema.index({"isArchived":1})

module.exports = mongoose.model('ProductConfiguration', docSchema);