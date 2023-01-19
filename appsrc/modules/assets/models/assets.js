const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');

const Schema = mongoose.Schema;

const assetSchema = new Schema({
    name: { type: String, required: true },
    status: { type: String },
    assetTag: { type: String },
    assetModel: { type: String },
    serial: { type: String, required: true },
    department: {
        type: Schema.ObjectId,
        ref: 'Department'
    },
    location: { type: String },
    notes: { type: String },
    image: { type: String },
    qrCode: { type: String },
    createdAt: { type: Date },
    updatedAt: { type: Date, default: Date.now },
    deletedAt: { type: Date },
});

assetSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Asset', assetSchema);
