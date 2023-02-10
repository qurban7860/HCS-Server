const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const GUID = require('mongoose-guid')(mongoose);


const Schema = mongoose.Schema;

const machineTechParamSchema = new Schema({
    name: { type: String , required: true, unique: true },
    // name of TechnicalParam 
    
    code: { type: String, required: true, unique: true },
    // any reserved text for config name
    
    description: { type: String },
    // description of TechnicalParam
    
    category: { type: Schema.Types.ObjectId , ref: 'machineTechParamCategory' }
    // Param category
},
{
    collection: 'MachineTechParams'
});

const baseSchema = require('./baseSchema');
machineTechParamSchema.add(baseSchema);

machineTechParamSchema.plugin(uniqueValidator);

module.exports = mongoose.model('MachineTechParam', machineTechParamSchema);
