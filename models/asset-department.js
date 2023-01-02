const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const assetDepartmentSchema = new Schema({
    name: { type: String, unique: true },
});

assetDepartmentSchema.plugin(uniqueValidator);

module.exports = mongoose.model('AssetModel', assetDepartmentSchema);
