const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const baseSchema = require('../../../base/baseSchema');

const GUID = require('mongoose-guid')(mongoose);


const Schema = mongoose.Schema;

const docSchema = new Schema({
    machine: { type: Schema.Types.ObjectId, required:true, ref: 'Machine' },

    defaultName: { type: String, required: true },
    // DefaultName for profile.
    
    names: [{ type: String, maxlength: 50 }],
    // Names list for profile.
    
    web: { type: String, maxlength: 35 },
    // Width
    
    flange: { type: String, maxlength: 35 },
    // Height
    type: {  type: String, enum: ['CUTOMER','MANUFACTURER'], default: 'CUSTOMER'},                  
    
},
{
    collection: 'MachineProfiles'
});
docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.plugin(uniqueValidator);

docSchema.index({"defaultName":1})
docSchema.index({"names":1})
docSchema.index({"width":1})
docSchema.index({"height":1})

docSchema.index({"isActive":1})
docSchema.index({"isArchived":1})

module.exports = mongoose.model('MachineProfile', docSchema);
