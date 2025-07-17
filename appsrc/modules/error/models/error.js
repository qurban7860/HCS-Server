const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const GUID = require('mongoose-guid')(mongoose);
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;
const docSchema = new Schema({
    subject: { type: String, required: true },
    code: { type: String, required: true },
    description: { type: String },
    slug: { type: String, required: true }
},
    {
        collection: 'Errors'
    });

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.index({ "isActive": 1 })
docSchema.index({ "isArchived": 1 })

docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Errors', docSchema);