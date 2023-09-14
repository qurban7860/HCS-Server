const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const baseSchema = require('../../../base/baseSchema');

const GUID = require('mongoose-guid')(mongoose);


const Schema = mongoose.Schema;

const docSchema = new Schema({
    name: { type: String , required: true, unique: true },
    // name of Tool 
    
    description: { type: String },
    // description of tool

    isManualSelect: { type: Boolean, default: false },  
    // can manual select
    
    isAssign: { type: Boolean, default: false },
    // can assign to component
    
    Operations: { type: Number, default: false },
    // number of operations
    
    toolType: {type: String, default: "GENERIC TOOL"}
},
{
    collection: 'MachineTools'
});
docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.plugin(uniqueValidator);

docSchema.index({"name":1})
docSchema.index({"isActive":1})
docSchema.index({"isArchived":1})

module.exports = mongoose.model('MachineTool', docSchema);
