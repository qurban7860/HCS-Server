const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const uniqueValidator = require('mongoose-unique-validator');
const baseSchema = require('../../../base/baseSchema');

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
    dimensions: {
        startX: { type: Number },
        startY: { type: Number },
        EndX: { type: Number },
        EndY: { type: Number }
    },
    operations: [{
        offset: { type: Number, required: true },
        tool: { type: Schema.Types.ObjectId, ref: 'MachineTool', required: true },
    }]
}, {
    collection: 'JobComponents'
});

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchemaForPublic);
docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('JobComponent', docSchema);