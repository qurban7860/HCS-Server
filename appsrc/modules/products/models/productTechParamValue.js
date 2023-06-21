const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const baseSchema = require('../../../base/baseSchema');

const GUID = require('mongoose-guid')(mongoose);
const Schema = mongoose.Schema;

const docSchema = new Schema({
    machine: { type: Schema.Types.ObjectId, required:true, ref: 'Machine' },
    // machine information 
    techParam: { type: Schema.Types.ObjectId , required:true, ref: 'MachineTechParam' },
    // configuration name
    techParamValue: { type: String },
    // value of configuration
    activatedAt: { type: Date , default: Date.now },
    // activation date for this configuration
    expiryDate: { type: Date },
    // expiry date for this configuration
    note: { type: String }
    //informative note
},
{
    collection: 'MachineTechParamValues'
});
docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.plugin(uniqueValidator);

docSchema.index({"machine":1})
docSchema.index({"techParam":1})
docSchema.index({"isActive":1})
docSchema.index({"isArchived":1})

module.exports = mongoose.model('MachineTechParamValue', docSchema);
