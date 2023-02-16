const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const baseSchema = require('../../../base/baseSchema');

const GUID = require('mongoose-guid')(mongoose);
const Schema = mongoose.Schema;

const docSchema = new Schema({
    
    serialNo: { type: String , required: true, unique: true},
    // Serial No of machine
  //

    parentMachine: { type: Schema.Types.ObjectId , ref: 'Machine' },
    // parent machine id
  
    parentSerialNo: { type: String },
    // Serial No of parent machine

    name: { type: String },
    // name/title of machine
  
    description: { type: String },
    // detailed description of machine

    status: { type: Schema.Types.ObjectId , ref: 'MachineStatus' },
    // Status information of machine
  
    supplier: { type: Schema.Types.ObjectId , ref: 'MachineSupplier' },
    // supplier information
  
    machineModel: { type: Schema.Types.ObjectId , ref: 'MachineModel' },
    // Status information of machine
  
    workOrderRef: { type: String },
    // information about work order, purchase order or quotation ref no
  
    customer: { type: Schema.Types.ObjectId , ref: 'Customer' },
    // customer for this machine
  
    instalationSite: { type: Schema.Types.ObjectId , ref: 'CustomerSite' },
    // site where machine is installed 
  
    billingSite: { type: Schema.Types.ObjectId , ref: 'CustomerSite' },
    // site which will be used billing purpose
  
    operators: [ {type: Schema.Types.ObjectId , ref: 'CustomerContact'}],
    // list of contacts from customer end who will work at this machine
  
    accountManager: { type: Schema.Types.ObjectId , ref: 'CustomerContact' },
    // account manager for this machine from Howick
  
    projectManager: { type: Schema.Types.ObjectId , ref: 'CustomerContact' },
    // technical project manager for this machine from Howick
  
    supportManager: { type: Schema.Types.ObjectId , ref: 'CustomerContact' },
    // support project manager for this machine from Howick
  
    license: { type: Schema.Types.ObjectId , ref: 'MachineLicense' },
    // current applied license
  
    logo: { type: Schema.Types.ObjectId  },
    // primary/logo image for the files collection  ref: 'SystemFile'
  
    tools: [{ type: Schema.Types.ObjectId , ref: 'MachineTool' }],
    // tools
    
    internalTags: [{ type: String }],
    // list of tags used for reporting internally (Howick)
  
    customerTags: [{ type: String }],
    // list of tags used for reporting by customer
},
{
    collection: 'Machines'
});

docSchema.set('timestamps', true);


docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);


docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Machine', docSchema);
