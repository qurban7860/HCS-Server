const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const baseSchema = require('../../../base/baseSchema');

const GUID = require('mongoose-guid')(mongoose);


const Schema = mongoose.Schema;

const docSchema = new Schema({
    machine: { type: Schema.Types.ObjectId, required:true, ref: 'Machine' },

    documentCategory: { type: Schema.Types.ObjectId, required:true, ref: 'DocumentCategory' },

    documentType: { type: Schema.Types.ObjectId, required:true, ref: 'DocumentType' },
    // any note for attachment
    
    document: { type: Schema.Types.ObjectId, required:true, ref: 'Document' }

},
{
    collection: 'MachineDrawings'
});
docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);


docSchema.index({"machine":1})
docSchema.index({"documentCategory":1})
docSchema.index({"documentType":1})
docSchema.index({"document":1})
docSchema.index({"isActive":1})
docSchema.index({"isArchived":1})


docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('MachineDrawing', docSchema);
