const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const baseSchema = require('../../../base/baseSchema');

const GUID = require('mongoose-guid')(mongoose);


const Schema = mongoose.Schema;

const docSchema = new Schema({
  
  serviceReport: { type: Schema.Types.ObjectId , ref: 'MachineServiceReport', required: true},
  // service Report id.

  machineCheckItem: {type: Schema.Types.ObjectId , ref: 'MachineCheckItem', required: true},
  //checkitem reference id
  
  checkItemListId: {type: Schema.Types.ObjectId , ref: 'MachineServiceReportTemplate.checkItemLists', required: true}, 
  //this will refer to the list to which checkitem is belong to,

  checkItemValue: { type: String },
  // if checked, then value will be considered
  
  comments: {type: String}, 
  // comments against this checkitem
  
  isHistory: {type: Boolean, default: false},
  //if value is updated flag should be set to true as considered as history one.

  archivedByMachine: {type: Boolean, default: false},
},
{
    collection: 'MachineServiceReportValues'
});
docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.plugin(uniqueValidator);

docSchema.index({"category":1})
docSchema.index({"isRequired":1})
docSchema.index({"inputType":1})


module.exports = mongoose.model('MachineServiceReportValue', docSchema);