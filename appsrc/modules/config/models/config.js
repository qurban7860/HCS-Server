const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const GUID = require('mongoose-guid')(mongoose);
const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;
const docSchema = new Schema({

        name: { type: String, minlength: 2, maxlength: 40 },
        // name of organization
        value: { type: String , required: true },
        type: {  type: String, enum: ['AUTH','ERROR-PAGES','NORMAL-CONFIG','ADMIN-CONFIG', 'RESPONSE'], default: 'NORMAL-CONFIG'},
        notes: { type: String },
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