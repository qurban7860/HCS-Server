const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const assetLocationSchema = new Schema({
    name: { type: String, unique: true },
});

assetLocationSchema.plugin(uniqueValidator);

module.exports = mongoose.model('AssetModel', assetLocationSchema);
