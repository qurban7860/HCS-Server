const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const baseSchema = require('../../../base/baseSchema');

const GUID = require('mongoose-guid')(mongoose);


const Schema = mongoose.Schema;

const docSchema = new Schema({
    machine: { type: Schema.Types.ObjectId, required:true, ref: 'Machine' },
    // machine information 

    connectedMachine: { type: Schema.Types.ObjectId, required:true, ref: 'Machine' },
    // machine connected/attached like decoiler 

    note: { type: String },
    // any note for attachment
    
    connectionDate: { type: Date , default: Date.now, required: true },
    // Date/Time for connection
    
    disconnectionDate: { type: Date },
    // Date/Time for connection
    
},
{
    collection: 'MachineConnections'
});
docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);


docSchema.index({"machine":1})
docSchema.index({"connectedMachine":1})
docSchema.index({"isActive":1})
docSchema.index({"isArchived":1})


docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('MachineConnection', docSchema);
