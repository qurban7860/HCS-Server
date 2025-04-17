const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const uniqueValidator = require('mongoose-unique-validator');
const baseSchema = require('../../../base/baseSchema');

const docSchema = new Schema({
    machine: { type: Schema.Types.ObjectId, ref: 'Machine', required: true },
    job: { type: Schema.Types.ObjectId, ref: 'ProductJob', required: true },
    startTime: { type: Date },
    endTime: { type: Date },
    statusTimeline: [
        {
            status: { type: Schema.Types.ObjectId, ref: 'JobExecutionStatus', required: true },
            updatedAt: { type: Date, default: Date.now },
            updatedBy: { type: Schema.Types.ObjectId, ref: 'SecurityUser' },
            updatedIP: { type: String }
        }
    ]
}, {
    collection: 'JobExecutions'
});

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchemaForPublic);

docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('JobExecution', docSchema);