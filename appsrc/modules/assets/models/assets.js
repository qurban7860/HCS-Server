const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');

const Schema = mongoose.Schema;

const assetSchema = new Schema({
    name: { type: String },
    status: { type: String},
    assetTag: { type: String },
    assetModel: { type: String },
    serial: { type: String, required: true },
    department_id: {  type: Schema.ObjectId },
    location: { type: String },
    notes: { type: String },
    image: { type: String },
    qrCode: { type: String },
    createdAt: { type: Date },
    updatedAt: { type: Date,  default: Date.now },
    deletedAt: { type: Date },
});

assetSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Asset', assetSchema);
