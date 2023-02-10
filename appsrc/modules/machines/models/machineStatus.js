const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const GUID = require('mongoose-guid')(mongoose);


const Schema = mongoose.Schema;

const machineStatusSchema = new Schema({
    name: { type: String , required: true, unique: true },
    // name of Status 
    /*
      Order Accepted
      Procurement Process Initiated
      In Production
      Ready for Shipment
      In Freight
      Received by Customer
      Deployment/Installation
      In Operation
    */
    description: { type: String },
    // description of Status
    
    displayOrderNo: { type: Number },
    // order to display in dropdown lists
},
{
    collection: 'MachineStatuses'
});

const baseSchema = require('./baseSchema');
machineStatusSchema.add(baseSchema);

machineStatusSchema.plugin(uniqueValidator);

module.exports = mongoose.model('MachineStatus', machineStatusSchema);
