const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const baseSchema = require('../../../base/baseSchema');

const GUID = require('mongoose-guid')(mongoose);
const Schema = mongoose.Schema;

const docSchema = new Schema({
    name: { type: String , required: true, unique: true },
    // name of suppplier 
    
    contactName: { type: String },
    // name of contact person of suppplier
    
    contactTitle: { type: String },
    // title of contact person of suppplier
},
{
    collection: 'MachineSuppliers'
});

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docContactSchema);
docSchema.add(baseSchema.docAddressSchema);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.plugin(uniqueValidator);

docSchema.index({"name":1})
docSchema.index({"isActive":1})
docSchema.index({"isArchived":1})

module.exports = mongoose.model('MachineSupplier', docSchema);
