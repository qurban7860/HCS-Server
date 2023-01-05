const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');

const Schema = mongoose.Schema;

const assetSchema = new Schema({
    name: { type: String },
    status: { type: String , required: true },
    assetTag: { type: String },
    assetModel: { type: String },
    serial: { type: Number , required: true },
    // locationId: {  type: Schema.ObjectId , required: true },
    location: {  type: String , required: true },
    department: { type: String},
    notes: { type: String},
    image: { type: String},
    qrCode: { type: String},
    createdAt: {  type: Date },
    updatedAt: {  type: Date },
    deletedAt: {  type: Date },
});

assetSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Asset', assetSchema);
