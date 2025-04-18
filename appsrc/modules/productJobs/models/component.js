const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const uniqueValidator = require('mongoose-unique-validator');
const baseSchema = require('../../../base/baseSchema');

const docSchema = new Schema({
    job: { type: Schema.Types.ObjectId, ref: 'ProductJob', required: true },
    label: { type: String, required: true },
    labelDirection: { type: String, required: true },
    quantity: { type: Number, required: true },
    length: { type: Number, required: true },
    profileShape: { type: String },
    webWidth: { type: Number },
    flangeHeight: { type: Number },
    materialThickness: { type: Number },
    materialGrade: { type: String },
    positions: {
        startX: { type: Number },
        startY: { type: Number },
        endX: { type: Number },
        endY: { type: Number }
    },
    operations: [{
        offset: { type: Number, required: true },
        operationType: { type: Schema.Types.ObjectId, ref: 'MachineTool', required: true },
    }]
}, {
    collection: 'JobComponents'
});

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchemaForPublic);
docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('JobComponent', docSchema);