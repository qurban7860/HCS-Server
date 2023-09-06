const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const baseSchema = require('../../../base/baseSchema');

const GUID = require('mongoose-guid')(mongoose);


const Schema = mongoose.Schema;

const docSchema = new Schema({  
  recordType: {type: String, required: true},
  // service/repair/training/install 
  
  machineModel: { type: Schema.Types.ObjectId , ref: 'MachineModel' },
  // Model information of machine
  
  docTitle: { type: String },
  // name/title of document/screen
  
  textBeforeParams: { type: String },
  // display this text before fields  
  
  checkParams : [{
    paramListTitle: { type: String },
    paramList : [{type: Schema.Types.ObjectId , ref: 'MachineServiceParam'}],
  }],
  
  textAfterFields: { type: String },
  // display this text before fields
  
  isOperatorSignatureRequired: { type: Boolean, default: false},
  // true if operator signature is required
  
  enableServiceNote: { type: Boolean, default: false},
  // enable Service Note at input screen
  
  enableMaintenanceRecommendations: { type: Boolean, default: false},
  // enable Maintenance Recommendations at input screen
  
  enableSuggestedSpares: { type: Boolean, default: false},
  // enable Suggested Spares at input screen
  
  header: {
    type: {type: String, default: 'text'},
    // it can be text or image. default is text
    leftText: {type: String},
    centerText: {type: String},
    rightText: {type: String}
    // for page number, use value pgNo.
  },
  footer: {
    type: {type: String, default: 'text'},
    // it can be text or image. default is text
    leftText: {type: String},
    centerText: {type: String},
    rightText: {type: String}
    // for page number, use value pgNo. 
  }
},
{
    collection: 'MachineServiceRecordConfigs'
});
docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.plugin(uniqueValidator);

docSchema.index({"recordType":1})
docSchema.index({"isActive":1})
docSchema.index({"isArchived":1})

module.exports = mongoose.model('MachineServiceRecordConfig', docSchema);
