const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const baseSchema = require('../../../base/baseSchema');

const GUID = require('mongoose-guid')(mongoose);


const Schema = mongoose.Schema;

const docSchema = new Schema({
  
  serviceRecord: { type: Schema.Types.ObjectId , ref: 'MachineServiceRecord' },
  // UID of machine service record.

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
  // Used for validatioin. like for 0-100, MinValiidation = 
},
{
    collection: 'MachineServiceRecordValues'
});
docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.plugin(uniqueValidator);

docSchema.index({"category":1})
docSchema.index({"isRequired":1})
docSchema.index({"inputType":1})


module.exports = mongoose.model('MachineServiceRecordValue', docSchema);