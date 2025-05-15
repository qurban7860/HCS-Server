const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const Schema = mongoose.Schema;
const baseSchema = require('../../../base/baseSchema');

const docSchema = new Schema({
    name: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
}, {
    collection: 'JobComponentExecutionStatuses'
});

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);
docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('JobComponentExecutionStatus', docSchema);