const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const baseSchema = require('../../../base/baseSchema');

const GUID = require('mongoose-guid')(mongoose);


const Schema = mongoose.Schema;

const docSchema = new Schema({  

  serviceRecordConfig: {  
    recordType: {type: String, required: true},
    // service/repair/training/install 
    
    machineModel: { type: Schema.Types.ObjectId , ref: 'MachineModel' },
    // Model information of machine
  
    category: { type: Schema.Types.ObjectId , ref: 'MachineCategory' },
    // Category information of machine
    
    docTitle: { type: String },
    // name/title of document/screen
    
    textBeforeCheckItems: { type: String },
    // display this text before fields  
    
    checkParams : [{
      paramListTitle: { type: String },
      paramList : [
          {  
    
            name: { type: String },
            // name/title of field
            
            printName: { type: String },
            // name/title to print at reports. default is same as name 
            
            category: { type: Schema.Types.ObjectId , ref: 'MachineCheckItemCategory' },
            // Category information of machine
              
            isRequired: {type: Boolean, default: false},
            // if true, it value must be required
            
            inputType: {type: String, required: true},
            // shortText, longText (multiline input), Number, Boolean
            
            unitType: {type: String},
            // like Meter, Cycle, Kg, etc
            
            minValidation: {type: String, maxLength: 100},
            maxValidation: {type: String, maxLength: 100},
            // Used for validatioin. like for 0-100, MinValiidation = 0, and maxVaidation = 100
            // For text value, The length of value can be 0 to 100. 
        }
      ],
    }],
    
    textAfterCheckItems: { type: String },
    // display this text before fields
    
    isOperatorSignatureRequired: { type: Boolean, default: false},
    // true if operator signature is required
    
    enableNote: { type: Boolean, default: false},
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
  
  technician: { type: Schema.Types.ObjectId , ref: 'SecurityUser' },
  // technician information who performed service process.
  
  technicianRemarks: { type: String },
  // operator comments against this record.
  
  checkParams: [{
    serviceParam: {type: Schema.Types.ObjectId , ref: 'MachineCheckItem'},
    name: {type: String},
    paramListTitle: {type: String},
    checked: {type: Boolean, default: false},
    value: {type: String},
    status: {type: String},
    comments: {type: String},
    date: {type: String},
    files: []
  }],

  serviceNote: { type: String },
  //some notes regarding service/installation/training,
  
  maintenanceRecommendation: { type: String },
  //recommendations if required
  
  suggestedSpares: { type: String },
  //detail of suggested spares
  
  // files : []
  // list of documents/images related to this record
  
  operators: [{ type: Schema.Types.ObjectId , ref: 'CustomerContact' }],
  // operators who is training.
  
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
