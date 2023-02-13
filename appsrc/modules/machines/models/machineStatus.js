const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const baseSchema = require('../../../base/baseSchema');

const GUID = require('mongoose-guid')(mongoose);
const Schema = mongoose.Schema;

const docSchema = new Schema({
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
docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('MachineStatus', docSchema);
