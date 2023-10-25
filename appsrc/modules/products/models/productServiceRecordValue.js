const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const baseSchema = require('../../../base/baseSchema');

const GUID = require('mongoose-guid')(mongoose);


const Schema = mongoose.Schema;

const docSchema = new Schema({
  
  serviceRecord: { type: Schema.Types.ObjectId , ref: 'MachineServiceRecords' },
  // service record id.
  
  machineCheckItem: {type: Schema.Types.ObjectId , ref: 'MachineCheckItems'},
  //checkitem reference id
  
  checkItemListId: {type: Schema.Types.ObjectId , ref: 'MachineServiceRecordConfig.checkItemLists'}, 
  //this will refer to the list to which checkitem is belong to,

  checkItemValue: {type: String},
  // if checked, then value will be considered
  
  comments: {type: String}, 
  // comments against this checkitem
  
  files : []
  // list of documents/images related to this checkitem

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