const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const GUID = require('mongoose-guid')(mongoose);


const Schema = mongoose.Schema;

const machineToolSchema = new Schema({
    name: { type: String , required: true, unique: true },
    // name of Tool 
    
    description: { type: String },
    // description of tool
    
    isDisabled: { type: Boolean, default: false },
    // a tool can be disabled. A disabled tool can not be used to 
    // perform any new action like selling machines or new contact, etc. 
     
    isArchived: { type: Boolean, default: false },
    // a tool can be archived. An archived tool and its associated 
    // data will not appear in reports
    
    createdAt: { type: Date , default: Date.now },
    // Date/Time for record creation. more detail is in auditlog collection
    
    updatedAt: { type: Date , dfault: Date.now }
    // Date/Time for record last updated. more detail is in auditlog collection
},
{
    collection: 'MachineTools'
});

machineToolSchema.plugin(uniqueValidator);

module.exports = mongoose.model('MachineTool', machineToolSchema);
