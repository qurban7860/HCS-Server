const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const baseSchema = require('../../../base/baseSchema');

const Schema = mongoose.Schema;

const docSchema = new Schema({  
  
  machine: { type: Schema.Types.ObjectId , ref: 'Machine', required: true },
  // machine information.
  
  portalKey: { type: String, required: true  },
  // Machine portal key

  machineSerialNo: { type: String, required: true },

  computerGUID: { type: String },

  IPC_SerialNo: { type: String },
},

{
    collection: 'MachineIntegrationRecord',
});

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);

docSchema.plugin(uniqueValidator);

docSchema.index({"recordType":1})
docSchema.index({"isActive":1})
docSchema.index({"isArchived":1})

module.exports = mongoose.model('MachineIntegrationRecord', docSchema);
