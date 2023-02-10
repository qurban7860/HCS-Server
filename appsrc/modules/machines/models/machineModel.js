const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const GUID = require('mongoose-guid')(mongoose);


const Schema = mongoose.Schema;

const machineModelSchema = new Schema({
    name: { type: String, required: true, unique: true },
    // name of model 
    
    description: { type: String  },
    // description of model
    
    category: { type: Schema.Types.ObjectId , ref: 'MachineCategory' },
    // product information
},
{
    collection: 'MachineModels'
});

const baseSchema = require('./baseSchema');
machineModelSchema.add(baseSchema);

machineModelSchema.plugin(uniqueValidator);

module.exports = mongoose.model('MachineModel', machineModelSchema);
