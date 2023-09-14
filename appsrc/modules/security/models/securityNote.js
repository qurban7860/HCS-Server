const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const baseSchema = require('../../../base/baseSchema');

const GUID = require('mongoose-guid')(mongoose);
const Schema = mongoose.Schema;

const docSchema = new Schema({
    user: { type: Schema.Types.ObjectId, required:true },
    // machine for which license is generated
  
    note: { type: String, required: true },
    //  key
},
{
    collection: 'SecurityNotes'
});

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.plugin(uniqueValidator);

docSchema.index({"user":1})
docSchema.index({"isActive":1})
docSchema.index({"isArchived":1})


module.exports = mongoose.model('SecurityNote', docSchema);
