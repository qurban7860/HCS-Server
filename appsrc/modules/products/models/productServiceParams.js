const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const baseSchema = require('../../../base/baseSchema');

const GUID = require('mongoose-guid')(mongoose);


const Schema = mongoose.Schema;

const docSchema = new Schema({  
   
    name: { type: String },
    // name/title of field
    
    printName: { type: String },
    // name/title to print at reports. default is same as name 
    
    description: { type: String },
    // detailed description of field
    
    helpHint: { type: String },
    // display this text as help at input screen

    linkToUserManual: { type: String },
    // link to user manual for this parameter 
    
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

    isActive: { type: Boolean, default: true },
    // a document can be disabled. A disabled document can not be used to 
    // perform any new action. 
  
    isArchived: { type: Boolean, default: false },
    // an document can be archived. An archived document and its associated 
    // data will not appear in reports
  
    createdBy: { type: Schema.Types.ObjectId , ref: 'SecurityUser' },
    // System user information who has created document. 
    
    createdAt: { type: Date , default: Date.now, required: true },
    // Date/Time for record creation. 
    
    createdIP: {type: String},
    //user ip address
    
    updatedBy: { type: Schema.Types.ObjectId , ref: 'SecurityUser' },
    // System user information who has updated document. 
    
    updatedAt: { type: Date , default: Date.now, required: true },
    // Date/Time for record last updated. 
    
    updatedIP: {type: String},
    //user ip address
},
{
    collection: 'MachineServiceParams'
});
docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.plugin(uniqueValidator);

docSchema.index({"name":1})
docSchema.index({"isActive":1})
docSchema.index({"isArchived":1})

module.exports = mongoose.model('MachineServiceParam', docSchema);
