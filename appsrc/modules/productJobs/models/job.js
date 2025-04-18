const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const uniqueValidator = require('mongoose-unique-validator');
const baseSchema = require('../../../base/baseSchema');

const docSchema = new Schema({
    machine: { type: Schema.Types.ObjectId, ref: 'Machine', required: true },
    unitOfLength: { type: String, required: true },
    profileName: { type: String, required: true },
    profileDescription: { type: String, required: true },
    frameset: { type: String, required: true },
    csvVersion: { type: String, required: true },
}, {
    collection: 'ProductJobs'
});

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchemaForPublic);
docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('ProductJob', docSchema);