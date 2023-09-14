const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const GUID = require('mongoose-guid')(mongoose);
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;
const docSchema = new Schema({

        name: { type: String , required: true, minlength: 2, maxlength: 40 },
        // name of organization
        value: { type: String , required: true },
       
},
{
        collection: 'Configs'
});
docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);
docSchema.index({"name":1})

docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Config', docSchema);