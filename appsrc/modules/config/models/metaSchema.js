const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const GUID = require('mongoose-guid')(mongoose);
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;
const docSchema = new Schema({
        configJSON: { type: Schema.Types.Mixed, required: true},
        collectionType: { type: String, required: true},
        version: { type: String},
        permissions: { type: String},
        description: { type: String},
},
{
        collection: 'metaSchemas'
});
docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);
docSchema.index({"name":1})

docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('metaSchema', docSchema);




