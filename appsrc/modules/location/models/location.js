const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');

const Schema = mongoose.Schema;

const locationSchema = new Schema({
    name: { type: String },
    createdAt: {  type: Date },
    updatedAt: {  type: Date },
    deletedAt: {  type: Date },
});

locationSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Location', locationSchema);
