const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const uniqueValidator = require('mongoose-unique-validator');
const baseSchema = require('../../../base/baseSchema');

const dimensionsSchema = new Schema({
    startX: { type: Number },
    startY: { type: Number },
    EndX: { type: Number },
    EndY: { type: Number }
});

const operationsSchema = new Schema({
    offset: { type: Number, required: true },
    tool: { type: Schema.Types.ObjectId, ref: 'MachineTool', required: true },
});

const docSchema = new Schema({
    label: { type: String, required: true },
    labelDirectory: { type: String, required: true },
    quantity: { type: Number, required: true },
    length: { type: Number, required: true },
    profileShape: { type: String },
    webWidth: { type: Number },
    flangeHeight: { type: Number },
    materialThickness: { type: Number },
    materialGrade: { type: String },
    dimensions: { type: dimensionsSchema },
    operations: {
        type: [operationsSchema],
        validate: {
            validator: function (v) {
                return v.length > 0;
            },
            message: 'operations must not be empty'
        }
    }
}, {
    collection: 'JobComponents'
});

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);
docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('JobComponent', docSchema);