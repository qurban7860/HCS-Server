const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const baseSchema = require('../../../base/baseSchema');

const GUID = require('mongoose-guid')(mongoose);
const Schema = mongoose.Schema;

const docSchema = new Schema({
    machine: { type: Schema.Types.ObjectId, required:true, ref: 'Machine' },
    // machine for which license is generated
  
    licenseKey: { type: String, required: true, unique:true },
    // license key
    
    // license detail
    licenseDetail: {
        version: { type: String },
        type: { type: String },
        deviceName: { type: String },
        deviceGUID: { type: String },
        production: { type: Number },
        waste: { type: Number },
        extensionTime:{ type: Date , default: Date.now, required: true },
        requestTime:{ type: Date , default: Date.now, required: true } 
    }  
      
},
{
    collection: 'MachineLicenses'
});

docSchema.set('timestamps', true);
docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);


docSchema.index({"machine":1})
docSchema.index({"licenseKey":1})
docSchema.index({"isActive":1})
docSchema.index({"isArchived":1})

docSchema.plugin(uniqueValidator);

module.exports = mongoose.model('MachineLicense', docSchema);
