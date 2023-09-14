const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const baseSchema = require('../../../base/baseSchema');

const GUID = require('mongoose-guid')(mongoose);


const Schema = mongoose.Schema;

const docSchema = new Schema({  
  recordType: { type: Date , default: Date.now, required: true },
  // service/repair/training/install
  
  serviceRecordConfig: { type: Schema.Types.ObjectId , ref: 'MachineServiceRecordConfig' },
  // record configuration used to create this record.
  
  serviceDate: { type: Date , default: Date.now, required: true },
  // date of service
  
  customer: { type: Schema.Types.ObjectId , ref: 'Customer' },
  // customer information.
  
  site: { type: Schema.Types.ObjectId , ref: 'CustomerSite' },
  // site information.
  
  machine: { type: Schema.Types.ObjectId , ref: 'Machine' },
  // machine information.
  
  decoilers: [{ type: Schema.Types.ObjectId , ref: 'Machine' }],
  // decoiler information attached to machine.
  
  technician: { type: Schema.Types.ObjectId , ref: 'CustomerContact' },
  // technician information who performed service process.
   
  params: [{
    serviceParam: {type: Schema.Types.ObjectId , ref: 'MachineServiceParam'},
    name: {type: String},
    checked: {type: Boolean, default: false},
    value: {type: String},
    comments: {type: String} 
  }],
  
  additionalParams: [{
    serviceParam: {type: Schema.Types.ObjectId , ref: 'MachineServiceParam'},
    name: {type: String},
    checked: {type: Boolean, default: false},
    value: {type: String},
    comments: {type: String} 
  }],
  
  machineMetreageParams: [{
    serviceParam: {type: Schema.Types.ObjectId , ref: 'MachineServiceParam'},
    name: {type: String},
    checked: {type: Boolean, default: false},
    value: {type: String},
    comments: {type: String} 
  }],
  
  punchCyclesParams: [{
    serviceParam: {type: Schema.Types.ObjectId , ref: 'MachineServiceParam'},
    name: {type: String},
    checked: {type: Boolean, default: false},
    value: {type: String},
    comments: {type: String} 
  }],
  
  serviceNote: { type: String },
  //some notes regarding service/installation/training,
  
  maintenanceRecommendation: { type: String },
  //recommendations if required
  
  suggestedSpares: { type: String },
  //detail of suggested spares
  
  // files : []
  // list of documents/images related to this record
  
  operator: { type: Schema.Types.ObjectId , ref: 'CustomerContact' },
  // operator who is training.
  
  operatorRemarks: { type: String },
  // operator comments against this record.
},
{
    collection: 'MachineServiceRecords'
});
docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.plugin(uniqueValidator);

docSchema.index({"recordType":1})
docSchema.index({"serviceDate":1})
docSchema.index({"isActive":1})
docSchema.index({"isArchived":1})

module.exports = mongoose.model('MachineServiceRecord', docSchema);
