const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const baseSchema = require('../../../base/baseSchema');

const GUID = require('mongoose-guid')(mongoose);
const Schema = mongoose.Schema;

const docSchema = new Schema({
    name: { type: String},
    // name of model 
    
    description: { type: String  },
    // description of model
    
    category: { type: Schema.Types.ObjectId , ref: 'MachineCategory' },
    // product information
},
{
    collection: 'MachineModels'
});


docSchema.add(baseSchema.docVisibilitySchema);
docSchema.add(baseSchema.docAuditSchema);
docSchema.set('timestamps', true);
docSchema.plugin(uniqueValidator);

docSchema.index({"name":1})
docSchema.index({"category":1})
docSchema.index({"isActive":1})
docSchema.index({"isArchived":1})


module.exports = mongoose.model('MachineModel', docSchema);
