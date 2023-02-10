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
     
    isDisabled: { type: Boolean, default: false },
    // a Status can be disabled. A disabled Status can not be used to 
    // perform any new action like selling machines or new contact, etc. 
     
    isArchived: { type: Boolean, default: false },
    // a Status can be archived. An archived Status and its associated 
    // data will not appear in reports
    
    createdAt: { type: Date , default: Date.now },
    // Date/Time for record creation. more detail is in auditlog collection
    
    updatedAt: { type: Date , dfault: Date.now }
    // Date/Time for record last updated. more detail is in auditlog collection
},
{
    collection: 'MachineStatuses'
});

machineStatusSchema.plugin(uniqueValidator);

module.exports = mongoose.model('MachineStatus', machineStatusSchema);
