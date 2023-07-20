const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const GUID = require('mongoose-guid')(mongoose);
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;
const docSchema = new Schema({
        country_code: { type: String , required: true },
        // name of organization
        country_name: { type: String , required: true },
},
{
        collection: 'Countries'
});
docSchema.index({"country_code":1})
docSchema.index({"country_name":1})


module.exports = mongoose.model('Country', docSchema);