const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;

const logFormatSchema = new Schema({
    colName: { type: String, required: true },
    dataType: { type: String, enum: ['String', 'Number', 'Date', 'Boolean'], default: 'OTHER' },
    // dataType: { type: String },
    measurementUnit: { type: String },
    colNumber: { type: Number, required: true }
});

const docSchema = new Schema({
    logType: { type: String, enum: ['ErpLog'], default: 'OTHER' },
    logVersion: { type: String },
    logFormat: {
        type: [logFormatSchema],
        validate: {
            validator: function (v) {
                return v.length > 0; // Ensure the array is not empty
            },
            message: 'logFormat array must not be empty'
        }
    }
}, {
    collection: 'LogFormats'
});

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('LogFormat', docSchema);