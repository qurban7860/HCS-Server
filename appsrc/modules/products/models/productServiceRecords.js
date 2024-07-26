const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const baseSchema = require('../../../base/baseSchema');

const GUID = require('mongoose-guid')(mongoose);


const Schema = mongoose.Schema;

const docSchema = new Schema({  

  serviceRecordConfig: { type: Schema.Types.ObjectId , ref: 'MachineServiceRecordConfig' },
  // record configuration used to create this record.

  serviceId: { type: Schema.Types.ObjectId , ref: 'MachineServiceRecords' },
  // purpose is to maintain parent service record config uuid
  
  serviceDate: { type: Date , default: Date.now, required: true },
  // date of service

  versionNo: { type: Number, },
  // Maintain versionNo
  
  customer: { type: Schema.Types.ObjectId , ref: 'Customer' },
  // customer information.
  
  site: { type: Schema.Types.ObjectId , ref: 'CustomerSite' },
  // site information.
  
  machine: { type: Schema.Types.ObjectId , ref: 'Machine' },
  // machine information.
  
  decoilers: [{ type: Schema.Types.ObjectId , ref: 'Machine' }],
  // decoiler information attached to machine.
  
  technician: { type: Schema.Types.ObjectId , ref: 'SecurityUser' },
  // technician information who performed service process.
  
  serviceRecordUid: { type: String, required: true  },
  //indication of current active record status.

  status: { type: String, enum: ['DRAFT','SUBMITTED', 'APPROVED'], default: 'DRAFT' },
  //indication of current active record status.

  technicianNotes: { type: String },
  // operator comments against this record.

  textBeforeCheckItems: { type: String },
  // display this text before fields. default will be copied from configurtation
  
  textAfterCheckItems: { type: String },
  // display this text before fields
  
  serviceNote: { type: String },
  //some notes regarding service/installation/training,
  
  recommendationNote: { type: String },
  //recommendations if required
  
  internalComments: { type: String },
  //Internal comments in machine service record . this comments will not be printed at PDF and not visible to customer

  
  suggestedSpares: { type: String },
  //detail of suggested spares

  internalNote: { type: String },
  //internal notes will not be visibile to customer,
  
  operators: [{ type: Schema.Types.ObjectId , ref: 'CustomerContact' }],
  // operators who is training.
  
  operatorNotes: { type: String },
  // operator comments against this record.

  isHistory: { type: Boolean, default: false },
  // just indication of current active record.

  archivedByMachine: {type: Boolean, default: false},
},
{
    collection: 'MachineServiceRecords'
});
docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.plugin(uniqueValidator);

docSchema.index({"recordType":1})
docSchema.index({"operators":1})
docSchema.index({"serviceDate":1})
docSchema.index({"isActive":1})
docSchema.index({"isArchived":1})

module.exports = mongoose.model('MachineServiceRecord', docSchema);
