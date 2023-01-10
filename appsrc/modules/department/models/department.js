const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');

const Schema = mongoose.Schema;

const departmentSchema = new Schema({
    name: { type: String },
    createdAt: {  type: Date },
    updatedAt: {  type: Date },
    deletedAt: {  type: Date },
});

departmentSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Department', departmentSchema);
