const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const baseSchema = require('../../../base/baseSchema');

const GUID = require('mongoose-guid')(mongoose);
const Schema = mongoose.Schema;

const docSchema = new Schema({
    machine: { type: Schema.Types.ObjectId, required:true, ref: 'Machine' },
    // machine for which license is generated
  
    note: { type: String, required: true },
    // license key
},
{
    collection: 'MachineNotes'
});

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.plugin(uniqueValidator);

docSchema.index({"machine":1})
docSchema.index({"isActive":1})
docSchema.index({"isArchived":1})


module.exports = mongoose.model('MachineNote', docSchema);
