const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const uniqueValidator = require('mongoose-unique-validator');
const baseSchema = require('../../../base/baseSchema');

const docSchema = new Schema({
    measurementUnit: { type: String, required: true },
    profile: { type: String, required: true },
    frameset: { type: String, required: true },
    version: { type: String, required: true },
    components: [{ type: Schema.Types.ObjectId, ref: 'JobComponent', required: true }]
}, {
    collection: 'ProductJobs'
});

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('ProductJob', docSchema);