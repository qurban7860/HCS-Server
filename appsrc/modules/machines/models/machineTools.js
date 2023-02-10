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
},
{
    collection: 'MachineTools'
});

const baseSchema = require('./baseSchema');
machineToolSchema.add(baseSchema);

machineToolSchema.plugin(uniqueValidator);

module.exports = mongoose.model('MachineTool', machineToolSchema);
